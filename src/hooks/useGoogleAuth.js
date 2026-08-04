import { useCallback, useEffect, useRef, useState } from 'react'

const GIS_SRC = 'https://accounts.google.com/gsi/client'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Load the Google Identity Services script once, shared across all callers.
let gisPromise = null
function loadGis() {
  if (gisPromise) return gisPromise
  gisPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve()
    const s = document.createElement('script')
    s.src = GIS_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google sign-in'))
    document.head.appendChild(s)
  })
  return gisPromise
}

/**
 * Google sign-in via GIS implicit flow. Returns { ready, signIn }.
 * `signIn()` opens the Google popup and resolves with an access token, which
 * the backend verifies (audience + profile). No client secret needed.
 */
export function useGoogleAuth() {
  const [ready, setReady] = useState(false)
  const clientRef = useRef(null)

  useEffect(() => {
    if (!CLIENT_ID) return
    let cancelled = false
    loadGis()
      .then(() => {
        if (cancelled) return
        clientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: 'openid email profile',
          callback: () => {}, // replaced per-request in signIn()
        })
        setReady(true)
      })
      .catch(() => setReady(false))
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(() => {
    return new Promise((resolve, reject) => {
      const client = clientRef.current
      if (!client) return reject(new Error('Google sign-in is not ready yet'))
      client.callback = (resp) => {
        if (resp?.access_token) resolve(resp.access_token)
        else reject(new Error(resp?.error || 'Google sign-in was cancelled'))
      }
      client.error_callback = (err) =>
        reject(new Error(err?.message || 'Google sign-in was cancelled'))
      client.requestAccessToken()
    })
  }, [])

  return { ready: ready && !!CLIENT_ID, configured: !!CLIENT_ID, signIn }
}
