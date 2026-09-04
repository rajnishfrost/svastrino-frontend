/* Svastrino service worker — offline support.
 *
 *  - Precaches the built app shell so the site opens with no network.
 *  - /uploads/**  : network first, falls back to the DOWNLOADED-video cache.
 *                   We never auto-cache video here — only what the student
 *                   explicitly downloads (see utils/offlineVideo.js) is stored.
 *  - /api/user/learn/** : network first, caches the payload so the course page
 *                   still renders offline.
 *  - navigations  : fall back to the cached index.html (SPA).
 */
const SHELL_CACHE = 'svastrino-shell-v1'
const API_CACHE = 'svastrino-api-v1'
// Keep this name in sync with VIDEO_CACHE in src/utils/offlineVideo.js
const VIDEO_CACHE = 'svastrino-video-v1'

// Injected at build time by vite-plugin-pwa (list of built assets).
const MANIFEST = self.__WB_MANIFEST || []
const SHELL_URLS = [...new Set(MANIFEST.map((e) => (typeof e === 'string' ? e : e.url)).concat(['/', '/index.html']))]

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    // Start from a clean shell cache so a rebuild's new asset hashes replace the
    // old ones (otherwise a stale worker can hold hashes the new HTML never asks
    // for, and offline everything 404s).
    await caches.delete(SHELL_CACHE)
    const cache = await caches.open(SHELL_CACHE)
    // `cache: 'reload'` forces a full fresh fetch (no 304 / conditional empties),
    // so we always store a complete body. One 404 shouldn't fail the install.
    await Promise.all(SHELL_URLS.map(async (u) => {
      try {
        const res = await fetch(u, { cache: 'reload' })
        if (res.ok) await cache.put(u, res)
      } catch { /* offline / missing — skip */ }
    }))
    await self.skipWaiting()
  })())
})

// Match a cached asset by URL, ignoring the `Vary` header. Vite serves JS/CSS
// with `Vary: Origin`, which otherwise makes `caches.match(req)` miss offline
// (the replay request's Origin differs) even though the file IS cached.
const matchCached = (reqOrUrl, cacheName) =>
  caches.match(reqOrUrl, { ignoreVary: true, ...(cacheName ? { cacheName } : {}) })

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, API_CACHE, VIDEO_CACHE])
    const names = await caches.keys()
    await Promise.all(names.filter((n) => n.startsWith('svastrino-') && !keep.has(n)).map((n) => caches.delete(n)))
    await self.clients.claim()
  })())
})

/** Serve a cached media response, honouring a Range request (needed for MP4). */
async function serveMedia(req) {
  const cache = await caches.open(VIDEO_CACHE)
  const hit = await cache.match(req.url, { ignoreSearch: true, ignoreVary: true })
  if (!hit) return null

  const range = req.headers.get('range')
  if (!range) return hit

  const buf = await hit.arrayBuffer()
  const m = /bytes=(\d+)-(\d*)/.exec(range)
  if (!m) return hit
  const start = Number(m[1])
  const end = m[2] ? Math.min(Number(m[2]), buf.byteLength - 1) : buf.byteLength - 1
  const chunk = buf.slice(start, end + 1)
  return new Response(chunk, {
    status: 206,
    headers: {
      'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(chunk.byteLength),
      'Content-Type': hit.headers.get('Content-Type') || 'video/mp4',
    },
  })
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  const sameOrigin = url.origin === self.location.origin

  // 1) Media. A DOWNLOADED copy is served first, online or not. It used to be
  //    network-first, and that is why a saved video stalled part-way when the
  //    connection dropped: online, hls.js had read the real playlist and was
  //    on whichever quality it liked; when the network went, the segments it
  //    wanted next were never the ones that had been saved. Playing the saved
  //    copy from the start means the rung in use is always the rung on disk.
  //    Anything not saved streams as before.
  if (sameOrigin && url.pathname.startsWith('/uploads/')) {
    event.respondWith((async () => {
      const saved = await serveMedia(req)
      if (saved) return saved
      try {
        return await fetch(req)
      } catch {
        return Response.error()
      }
    })())
    return
  }

  // 1b) Media on a DIFFERENT origin. In production uploaded media is not served
  //     from this site at all — it comes from its own CloudFront distribution
  //     (CDN_URL), so a video URL is https://<media>.cloudfront.net/hls/… and
  //     rule 1 above, which needs BOTH the same origin and an /uploads/ path,
  //     never sees it. Without this the Download button still fills the cache
  //     and the video still refuses to play offline, which is the one thing the
  //     download was for.
  //
  //     Only a request we actually hold a downloaded copy of is taken over. For
  //     anything else cross-origin (fonts, the Google sign-in script, the
  //     payment gateway) the original failure is re-thrown, so those behave
  //     exactly as they did before this worker existed.
  //     Same rule as above: a saved copy comes first, whatever the network.
  if (!sameOrigin) {
    event.respondWith((async () => {
      const saved = await serveMedia(req)
      if (saved) return saved
      return fetch(req) // no copy - the original request, failures and all
    })())
    return
  }

  // 2) Course data + profile — keep the last good payload for offline rendering.
  //    (The profile matters: without it the app can't show who's signed in offline.)
  if (sameOrigin && (url.pathname.startsWith('/api/user/learn') || url.pathname.startsWith('/api/user/profile'))) {
    event.respondWith((async () => {
      try {
        const res = await fetch(req)
        if (res.ok) {
          const cache = await caches.open(API_CACHE)
          cache.put(req, res.clone())
        }
        return res
      } catch {
        const cached = await matchCached(req, API_CACHE)
        return cached || Response.error()
      }
    })())
    return
  }

  // 3) SPA navigations — fall back to the cached shell.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(req)
      } catch {
        const cached = (await matchCached('/index.html')) || (await matchCached('/'))
        if (!cached) return Response.error()
        // Re-wrap into a clean 200: the dev/preview server redirects
        // /index.html → /, and the browser REJECTS a `redirected` cached
        // response for a navigation (shows ERR_FAILED instead of the app).
        const body = await cached.blob()
        return new Response(body, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      }
    })())
    return
  }

  // 4) Other same-origin assets (JS/CSS/img) — NETWORK first, cache only as an
  //    offline fallback. (Cache-first here would serve a stale bundle.)
  if (sameOrigin) {
    event.respondWith((async () => {
      try {
        return await fetch(req)
      } catch {
        return (await matchCached(req)) || Response.error()
      }
    })())
  }
})
