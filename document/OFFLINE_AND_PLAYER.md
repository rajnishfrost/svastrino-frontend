# Video Player & Offline System (frontend)

## Custom player — `pages/user/learnpage/HlsPlayer.jsx` (+ `.css`, `PlayerIcons.jsx`)
YouTube-style controls over **hls.js** (native `<video controls>` replaced):
- Play/pause, seek bar (buffered + knob), time, **mute/volume slider**,
  **⚙ gear → Quality (Auto + 144p…source max, shows "Auto (480p)") + Speed (0.5–2×)**,
  fullscreen, buffering spinner. SVG icons in `PlayerIcons.jsx` (no emoji).
- **Adaptive by default**: hls.js auto-switches rungs by bandwidth (144p floor).
- **Seek-lock**: forward skipping is blocked until the video is watched to 90%
  once (`lockSeek` prop; `maxWatched` only advances on continuous playback so a
  seek can't bump it). After the first 90%, seeking is free — persisted server-side
  (`Progress.videoDoneAt`), so it stays unlocked across logins.
- **Protection (best-effort, no DRM)**: moving e-mail **watermark** (`watermark`
  prop), **pause + black cover** on tab-switch/window-blur, right-click/download/
  PiP disabled. True screenshot/record blackout needs DRM → AWS phase.

## Offline system

### Service worker — `src/sw.js` (built by vite-plugin-pwa, `injectManifest`, iife)
| Requests | Strategy |
|---|---|
| App shell (precache manifest + `/index.html`) | Cached on install (`cache:'reload'` for full bodies; shell cache rebuilt per deploy) |
| `/uploads/**` | Network first → downloaded-video cache (`svastrino-video-v1`; Range/206 supported for MP4). Nothing auto-cached — only explicit downloads |
| `/api/user/learn*`, `/api/user/profile` | Network first, last good payload cached (`svastrino-api-v1`) so the course page + profile render offline |
| Navigations | Network first → cached `/index.html` (SPA) |
| Other same-origin | Network first → cache fallback (never cache-first: stale-bundle bug) |

**All cache matches use `ignoreVary: true`** — Vite serves assets with
`Vary: Origin`, which otherwise makes offline lookups miss.
**The SW never runs in `vite dev`** (`devOptions.enabled:false`; `main.jsx` also
unregisters SWs in dev). **Test offline only on `npm run build && npm run preview`
(port 4173; `preview.proxy` forwards /api + /uploads to :5060).**

### Downloads — `src/utils/offlineVideo.js`
"Save for offline" flow: quality picker (`listQualities` — parses master.m3u8,
size estimate = bandwidth × duration) → `downloadVideo({height, meta})` caches ONE
rung's segments + a **slim master** listing just that rung, into Cache Storage.
Index in localStorage `svastrino:offline:v1` records `{at, height (actual rung),
bytes, slug, sessionId, title, course, durationMins}`. `listDownloads()` powers
the page below. Nothing ever lands in the device's Downloads folder.

### Offline session — `context/AuthContext.jsx`
Token + last profile cached in localStorage (`svastrino_user`), user state seeded
**synchronously** so `ProtectedRoute` passes offline. Logout happens **only on
401/403**; a network failure (error with no `.status`) keeps the session.

### Offline writes — `src/utils/outbox.js`
`enqueue({key, path, body})` (last-write-wins by key) + `flush()` on the `online`
event and app start (`main.jsx`). Queued: `videodone:<sessionId>` and
`answer:<questionId>`. Not queued: Start course / checkout (need the server).
Entries drop on success or 4xx, stay on network failure. Learn page shows the
pending count in its offline banner; **no optimistic unlocks** (the drip clock is
server-side, faking it would show wrong dates).

### Downloads page — `pages/user/downloadspage/Downloads.jsx` (`/downloads`)
Lists saved videos (title, course, actual quality, size, date) from localStorage —
renders with **zero network**. Play → `/learn/:slug`, Remove → clears the cache
entries. Linked from the navbar profile menu.

## Offline test checklist (preview build only!)
1. `npm run build && npm run preview` → open **:4173 ONLINE**, load twice
2. Log in → Save a session for offline (pick a quality)
3. DevTools ▸ Network ▸ Offline → reload → still logged in, video plays
4. Watch past 90% + answer offline → "will sync" → go Online → syncs, `load()` refreshes
