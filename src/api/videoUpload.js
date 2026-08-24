import { api, apiUpload } from './client.js'

/**
 * Uploading a course video.
 *
 * Two paths, and the server decides which: on a dev box the file goes through
 * the API as it always did, and on AWS the browser sends it straight to S3.
 * The direct path exists because CloudFront gives an origin 60 seconds to
 * respond and will not go past it, so a multi-gigabyte body cannot travel that
 * way at all — and because a 2 GB file has no business passing through the same
 * task that serves the site.
 *
 * Either way the caller gets the same two things: progress while it runs, and
 * one finished { url, type } at the end.
 */

/** Which path this deployment uses. → { mode: 's3'|'server', partSize, maxBytes } */
export const fetchUploadMode = () => api('/admin/upload/mode', { auth: 'admin' })

/**
 * Send one part and return its ETag. S3 needs the ETag of every part to stitch
 * them back together, and it only comes back as a response header — which is
 * why this is a bare fetch rather than the app's own client: the signed URL is
 * S3's, and attaching our auth header to it would make S3 reject the request.
 */
async function putPart(url, blob) {
  const res = await fetch(url, { method: 'PUT', body: blob })
  if (!res.ok) throw new Error(`Upload failed on one part (${res.status})`)
  const etag = res.headers.get('ETag')
  if (!etag) {
    throw new Error(
      'S3 did not return the part identifier. The bucket needs ETag in its CORS ExposeHeaders.',
    )
  }
  return etag
}

/**
 * Upload straight to S3 in parts, then ask the server to stitch them.
 * `onProgress(pct)` is called with whole bytes actually delivered, so it does
 * not jump to 100 and then sit there.
 */
export async function uploadDirectToS3(file, { partSize, onProgress, signal }) {
  const init = await api('/admin/upload/s3/init', {
    method: 'POST', auth: 'admin',
    body: { filename: file.name, size: file.size },
  })

  const size = partSize || init.partSize
  const total = Math.ceil(file.size / size)
  const parts = []
  let sent = 0

  try {
    for (let n = 1; n <= total; n += 1) {
      if (signal?.aborted) throw new Error('Upload cancelled')
      const blob = file.slice((n - 1) * size, Math.min(n * size, file.size))
      const { url } = await api('/admin/upload/s3/part-url', {
        method: 'POST', auth: 'admin',
        body: { key: init.key, uploadId: init.uploadId, partNumber: n },
      })
      const ETag = await putPart(url, blob)
      parts.push({ PartNumber: n, ETag })
      sent += blob.size
      onProgress?.(Math.round((sent / file.size) * 100))
    }
  } catch (err) {
    // Leaving an unfinished multipart upload behind costs storage until it is
    // aborted, so give it up on the way out and let the real error through.
    await api('/admin/upload/s3/abort', {
      method: 'POST', auth: 'admin', body: { key: init.key, uploadId: init.uploadId },
    }).catch(() => {})
    throw err
  }

  // → { jobId, key, url, status: 'processing' }
  return api('/admin/upload/s3/complete', {
    method: 'POST', auth: 'admin',
    body: { key: init.key, uploadId: init.uploadId, parts },
  })
}

/** The original path: POST the whole file to the API. → { uploadId, status } */
export function uploadThroughServer(file, { uploadId, onProgress }) {
  const fd = new FormData()
  fd.append('video', file)
  return apiUpload(`/admin/upload/video?uploadId=${uploadId}`, fd, {
    auth: 'admin',
    onProgress,
  })
}

/**
 * Follow a transcode job to its end. Resolves with the finished
 * { url, type, durationMins, warning } once the ladder is built — or once the
 * server has decided the original file will have to do.
 */
export function awaitTranscode(jobId, { onProgress, intervalMs = 1000 } = {}) {
  return new Promise((resolve, reject) => {
    const timer = setInterval(async () => {
      try {
        const s = await api(`/admin/upload/progress/${jobId}`, { auth: 'admin' })
        if (!s?.found) return
        if (s.status === 'ready') { clearInterval(timer); resolve(s); return }
        if (s.status === 'failed') { clearInterval(timer); reject(new Error(s.error || 'Video processing failed')); return }
        onProgress?.(s)
      } catch { /* transient — keep polling */ }
    }, intervalMs)
  })
}
