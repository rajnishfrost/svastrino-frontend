/**
 * In-app offline video (no device file).
 *
 * A "download" fetches the video's segments and stores them in the browser's
 * Cache Storage — the same sandbox the service worker reads from. Nothing lands
 * in the user's Downloads folder and the copy only plays inside this site.
 *
 * For HLS we download ONE quality rung (keeps the size sane) and cache a
 * rewritten master playlist that lists just that rung, so offline playback picks
 * it automatically. Online playback is untouched (the SW only falls back to this
 * cache when the network fails), so adaptive streaming still works normally.
 */
const VIDEO_CACHE = 'svastrino-video-v1' // keep in sync with src/sw.js
const INDEX_KEY = 'svastrino:offline:v1' // small local index for UI state
const USER_KEY = 'svastrino_user' // cached profile (AuthContext) — for scoping

const isHls = (url) => /\.m3u8($|\?)/i.test(url || '')

// The downloads index is PER USER, so one person's saved videos never show up
// for another account signed in on the same device. The key is namespaced by
// the cached profile id; 'guest' is a harmless fallback (downloads only happen
// on the protected Learn page, so a real id is virtually always present).
function currentUserId() {
  try {
    const u = JSON.parse(localStorage.getItem(USER_KEY) || 'null')
    return u?.id ? String(u.id) : 'guest'
  } catch {
    return 'guest'
  }
}
const indexKey = () => `${INDEX_KEY}:${currentUserId()}`

// One-time cleanup: an earlier build kept a single un-scoped index, which leaked
// one user's downloads to every account on the device. Drop it so nothing is
// shown to the wrong owner (videos re-save cleanly under the per-user key).
try {
  if (localStorage.getItem(INDEX_KEY) != null) localStorage.removeItem(INDEX_KEY)
} catch { /* ignore */ }

// Video URLs are stored relative ("/uploads/hls/…/master.m3u8"). `new URL(x, base)`
// REQUIRES an absolute base, so resolve against the page first — otherwise
// parsing throws "Failed to construct 'URL': Invalid base URL".
const absUrl = (u) => new URL(u, window.location.href).href
const dirOf = (url) => {
  const a = absUrl(url)
  return a.slice(0, a.lastIndexOf('/') + 1)
}

/* ---------- local index (what's downloaded) — scoped to the signed-in user ---------- */
const readIndex = () => {
  try { return JSON.parse(localStorage.getItem(indexKey()) || '{}') } catch { return {} }
}
const writeIndex = (idx) => {
  try { localStorage.setItem(indexKey(), JSON.stringify(idx)) } catch { /* quota */ }
}
export const getDownloadInfo = (url) => readIndex()[url] || null
export const isDownloaded = (url) => !!readIndex()[url]

/** Everything saved for offline, newest first — renders with zero network. */
export const listDownloads = () =>
  Object.entries(readIndex())
    .map(([url, rec]) => ({ url, ...rec }))
    .sort((a, b) => (b.at || 0) - (a.at || 0))

/* ---------- playlist parsing (exported for tests) ---------- */
export function parseMaster(text, masterUrl) {
  const base = dirOf(masterUrl)
  const lines = text.split('\n').map((l) => l.trim())
  const variants = []
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('#EXT-X-STREAM-INF')) continue
    const res = /RESOLUTION=\d+x(\d+)/.exec(lines[i])
    const bw = /BANDWIDTH=(\d+)/.exec(lines[i])
    const uri = lines[i + 1]
    if (!uri || uri.startsWith('#')) continue
    variants.push({
      tag: lines[i], uri, url: new URL(uri, base).href,
      height: res ? Number(res[1]) : 0,
      bandwidth: bw ? Number(bw[1]) : 0,
    })
  }
  return variants
}

export function parseSegments(text, playlistUrl) {
  const base = dirOf(playlistUrl)
  return text.split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((uri) => new URL(uri, base).href)
}

/** Pick the rung to store: the best one at or below `maxHeight`, else the smallest. */
export function pickVariant(variants, maxHeight = 480) {
  const sorted = [...variants].sort((a, b) => a.height - b.height)
  const fit = sorted.filter((v) => v.height <= maxHeight).pop()
  return fit || sorted[0]
}

/**
 * Qualities available for offline saving, with a rough size estimate so the
 * student can choose (bandwidth × duration ÷ 8). Empty for non-HLS videos.
 */
export async function listQualities(url, durationSec = 0) {
  if (!isHls(url)) return []
  const res = await fetch(url)
  if (!res.ok) throw new Error('Could not read the available qualities')
  return parseMaster(await res.text(), url)
    .map((v) => ({
      height: v.height,
      bandwidth: v.bandwidth,
      bytes: durationSec && v.bandwidth ? (v.bandwidth * durationSec) / 8 : 0,
    }))
    .sort((a, b) => a.height - b.height)
}

/* ---------- download / remove ---------- */
/** Drop every cached entry under a video's folder (its playlists and segments). */
async function purgeFolder(cache, url) {
  const base = isHls(url) ? dirOf(url) : absUrl(url)
  const keys = await cache.keys()
  await Promise.all(keys.filter((r) => r.url.startsWith(base)).map((r) => cache.delete(r)))
}

/**
 * Download a video for offline use.
 * @param {string} url        master.m3u8 (or a plain media URL)
 * @param {object} opts       { maxHeight = 480, onProgress(pct, done, total) }
 */
export async function downloadVideo(url, { height = null, maxHeight = 480, onProgress, meta = {} } = {}) {
  if (!('caches' in window)) throw new Error('Offline storage is not supported in this browser')
  // Ask the browser not to evict our data.
  try { await navigator.storage?.persist?.() } catch { /* best effort */ }

  const cache = await caches.open(VIDEO_CACHE)
  let bytes = 0
  let savedHeight = null // the rung we actually stored, for the downloads list
  const track = async (res) => {
    const b = res.clone()
    try { bytes += (await b.arrayBuffer()).byteLength } catch { /* ignore */ }
  }

  try {
  if (!isHls(url)) {
    // Plain file (MP4 fallback uploads)
    const res = await fetch(url)
    if (!res.ok) throw new Error('Could not fetch the video')
    await track(res)
    await cache.put(absUrl(url), res.clone())
    onProgress?.(100, 1, 1)
  } else {
    const masterRes = await fetch(url)
    if (!masterRes.ok) throw new Error('Could not fetch the video playlist')
    const masterText = await masterRes.text()

    const variants = parseMaster(masterText, url)
    if (!variants.length) throw new Error('No playable quality found')
    // Exact rung if the student picked one, else the best at/below maxHeight.
    const chosen = (height && variants.find((v) => v.height === height)) || pickVariant(variants, maxHeight)
    savedHeight = chosen.height

    const varRes = await fetch(chosen.url)
    if (!varRes.ok) throw new Error('Could not fetch the quality playlist')
    const varText = await varRes.text()
    const segments = parseSegments(varText, chosen.url)

    const total = segments.length + 2
    let done = 0
    const bump = () => onProgress?.(Math.round((++done / total) * 100), done, total)

    // Cache the variant playlist as-is…
    await cache.put(chosen.url, new Response(varText, { headers: { 'Content-Type': 'application/vnd.apple.mpegurl' } }))
    bump()

    // …and a master that lists ONLY the downloaded rung, so offline picks it.
    const slimMaster = `#EXTM3U\n#EXT-X-VERSION:6\n${chosen.tag}\n${chosen.uri}\n`
    await cache.put(absUrl(url), new Response(slimMaster, { headers: { 'Content-Type': 'application/vnd.apple.mpegurl' } }))
    bump()

    // Segments, a few at a time.
    const BATCH = 4
    for (let i = 0; i < segments.length; i += BATCH) {
      const slice = segments.slice(i, i + BATCH)
      await Promise.all(slice.map(async (segUrl) => {
        const r = await fetch(segUrl)
        if (!r.ok) throw new Error('Download failed — please retry')
        await track(r)
        await cache.put(segUrl, r.clone())
        bump()
      }))
    }
  }
  } catch (err) {
    // Half a video is worse than none. With its slim playlist in the cache the
    // player would choose the saved copy and then stall on the first segment
    // that never arrived - so a failed download leaves nothing behind.
    await purgeFolder(cache, url).catch(() => {})
    throw err
  }

  const idx = readIndex()
  idx[url] = {
    at: Date.now(),
    height: savedHeight, // the rung actually stored (not the requested cap)
    bytes,
    ...meta, // slug, sessionId, title, durationMins — so /downloads needs no network
  }
  writeIndex(idx)
  return { bytes, height: savedHeight }
}

/** Remove a downloaded video (everything under its folder). */
export async function removeDownload(url) {
  if (!('caches' in window)) return
  const cache = await caches.open(VIDEO_CACHE)
  await purgeFolder(cache, url)
  const idx = readIndex()
  delete idx[url]
  writeIndex(idx)
}

/** Rough storage usage/quota for a "x MB used" hint. */
export async function storageEstimate() {
  try {
    const { usage = 0, quota = 0 } = (await navigator.storage?.estimate?.()) || {}
    return { usage, quota }
  } catch {
    return { usage: 0, quota: 0 }
  }
}

export const fmtMB = (b) => `${(b / (1024 * 1024)).toFixed(1)} MB`
