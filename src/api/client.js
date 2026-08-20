// Tiny fetch wrapper for the Svastrino API. Base path /api is proxied to the
// backend by Vite in dev (see vite.config.js). One unified token powers both
// the user account and the admin panel (different token keys).

const USER_TOKEN_KEY = 'svastrino_token'

export const tokenStore = {
  get: () => localStorage.getItem(USER_TOKEN_KEY),
  set: (t) => localStorage.setItem(USER_TOKEN_KEY, t),
  clear: () => localStorage.removeItem(USER_TOKEN_KEY),
}

// One login: the site and the admin panel share a single session token, so
// signing in on either side signs you in on both. adminTokenStore is kept as a
// named export (the admin app imports it) but is the very same store.
export const adminTokenStore = tokenStore

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

/**
 * True when an error is a connectivity failure (device offline, server
 * unreachable, DNS, CORS-level network error) rather than an HTTP error the
 * server actually returned. `fetch` throws a TypeError in these cases, so it
 * carries no `status`; HTTP errors from `api()` always do.
 */
export function isNetworkError(err) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
  if (!err) return false
  if (err.status) return false // a real HTTP response came back
  return /failed to fetch|networkerror|load failed|network request failed/i.test(err.message || '')
}

/**
 * Generic request helper.
 * @param {string} path        e.g. "/user/auth/send-otp"
 * @param {object} opts        { method, body, auth: 'user' | 'admin' }
 */
export async function api(path, { method = 'GET', body, auth = false } = {}) {
  // FormData (file uploads) must NOT be JSON-stringified, and the browser sets
  // its own multipart Content-Type (with boundary), so we omit ours.
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  const headers = isForm ? {} : { 'Content-Type': 'application/json' }

  if (auth) {
    const token = auth === 'admin' ? adminTokenStore.get() : tokenStore.get()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`
    const err = new Error(message)
    err.status = res.status
    if (data?.code) err.code = data.code // e.g. 'EMAIL_NOT_VERIFIED'
    throw err
  }
  return data
}

/**
 * Fetch a non-JSON endpoint (e.g. a CSV template) as text, with auth. The plain
 * `api()` helper always parses JSON, and a bare <a href> can't carry the bearer
 * token — so downloads of authenticated files go through here and become a blob.
 */
export async function apiText(path, { auth = false } = {}) {
  const headers = {}
  if (auth) {
    const token = auth === 'admin' ? adminTokenStore.get() : tokenStore.get()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE}${path}`, { headers })
  if (!res.ok) {
    const err = new Error(`Download failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return res.text()
}

/** Save a string the browser already has as a file, without a round trip. */
export function downloadText(filename, text, mime = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * File upload with a real progress percentage. `fetch` cannot report upload
 * progress, so this uses XMLHttpRequest (the only API that exposes it).
 * @param {string} path              e.g. "/admin/upload/video?uploadId=abc"
 * @param {FormData} formData
 * @param {object} opts              { auth, onProgress(pct) }
 */
export function apiUpload(path, formData, { auth = false, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}${path}`)

    if (auth) {
      const token = auth === 'admin' ? adminTokenStore.get() : tokenStore.get()
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }

    xhr.onload = () => {
      let data = null
      try { data = JSON.parse(xhr.responseText) } catch { /* no JSON body */ }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data)
      const err = new Error(data?.error || `Upload failed (${xhr.status})`)
      err.status = xhr.status
      if (data?.code) err.code = data.code
      reject(err)
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.ontimeout = () => reject(new Error('Upload timed out'))

    xhr.send(formData)
  })
}
