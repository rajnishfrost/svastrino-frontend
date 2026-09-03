import { useCallback, useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import {
  IconPlay, IconPause, IconVolHigh, IconVolMute,
  IconFullscreen, IconExitFullscreen, IconLock,
} from '../../learnpage/PlayerIcons.jsx'

/**
 * Nirmaan · public preview player — a real course lesson, streamed from the same
 * CloudFront/HLS ladder students watch, but playable only inside one window.
 *
 * The point is the tease: the seek bar shows the WHOLE lesson, so a visitor can
 * see how much more there is, while playback and seeking are clamped to
 * [start, end]. Running past the window (or dragging beyond it) stops the video
 * and puts the free-trial call to action over it, at the exact moment they want
 * to keep watching.
 *
 * Nothing is fetched until the play button is pressed. Four of these sit on the
 * page, and four manifests + segment ladders downloading behind a visitor who
 * pressed nothing is bandwidth spent on no one. hls.js is still attached on
 * mount, with `autoStartLoad: false`, so the press itself can call both
 * `startLoad()` and `play()` inside the gesture — Safari blocks a `play()` that
 * arrives a tick later, which is what deferring the whole attach would cost.
 * `startPosition` then makes the first segment fetched land inside the preview
 * window rather than at 0:00.
 */
const fmt = (s) => {
  if (!Number.isFinite(s) || s < 0) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export default function PreviewPlayer({ src, start, end, fullSeconds = 0, ctaHref = '#free-trial' }) {
  const wrapRef = useRef(null)
  const videoRef = useRef(null)
  const barRef = useRef(null)
  const hlsRef = useRef(null)

  const [armed, setArmed] = useState(false)   // first play pressed → hls attached
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [current, setCurrent] = useState(start)
  const [duration, setDuration] = useState(fullSeconds)
  const [full, setFull] = useState(false)
  const [locked, setLocked] = useState(false) // window watched out (or seeked past)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0) // bumped by Try again to re-attach

  const total = duration || fullSeconds || end

  // ---- hls.js attach: wired up, but downloading nothing until asked ----
  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined

    if (Hls.isSupported()) {
      const hls = new Hls({
        capLevelToPlayerSize: true,
        startLevel: -1,
        startPosition: start,
        autoStartLoad: false, // nothing leaves the network until startLoad()
      })
      hlsRef.current = hls
      hls.loadSource(src)
      hls.attachMedia(video)
      // hls.js retries on its own and only reports `fatal` once it has given up,
      // so this does not fire on a merely slow connection.
      hls.on(Hls.Events.ERROR, (_e, d) => { if (d?.fatal) { setFailed(true); setLoading(false) } })
      return () => { hls.destroy(); hlsRef.current = null }
    }

    video.src = src // Safari plays HLS natively; preload="none" keeps it idle
    return undefined
  }, [src, start, attempt])

  useEffect(() => {
    const onFs = () => setFull(document.fullscreenElement === wrapRef.current)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const seekTo = useCallback((t) => {
    const v = videoRef.current
    if (!v) return
    const clamped = Math.max(start, Math.min(t, end))
    try { v.currentTime = clamped } catch { /* not seekable yet */ }
    setCurrent(clamped)
    // Reaching for the part they have not paid for is the same moment as
    // watching to the end of the window, so it gets the same answer.
    setLocked(t > end)
  }, [start, end])

  const onLoadedMetadata = (e) => {
    const v = e.target
    setDuration(v.duration || fullSeconds)
    // hls.js honours `startPosition`; native (Safari) playback starts at 0.
    if (v.currentTime < start - 0.25) { try { v.currentTime = start } catch { /* noop */ } }
    setLoading(false)
  }

  const onTime = (e) => {
    const v = e.target
    if (!v.paused && v.currentTime >= end) {
      v.pause()
      try { v.currentTime = end } catch { /* noop */ }
      setCurrent(end)
      setLocked(true)
      return
    }
    if (v.currentTime < start - 0.25) { try { v.currentTime = start } catch { /* noop */ } }
    setCurrent(v.currentTime)
  }

  // Everything that starts playback goes through here, and every path calls
  // play() synchronously — the browser only grants it inside the gesture.
  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (!armed) {
      setArmed(true); setLoading(true)
      hlsRef.current?.startLoad(start)
      v.play?.().catch(() => {})
      return
    }
    if (locked) { setLocked(false); seekTo(start); v.play?.().catch(() => {}); return }
    if (v.paused) v.play?.().catch(() => {})
    else v.pause()
  }

  const replay = () => { setLocked(false); seekTo(start); videoRef.current?.play?.().catch(() => {}) }
  const toggleMute = () => { const v = videoRef.current; if (v) v.muted = !v.muted }
  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else wrapRef.current?.requestFullscreen?.()
  }
  // Re-running the attach effect re-fetches from scratch; the cached failure is
  // not replayed. The visitor is back on the poster and presses play again.
  const retry = () => { setFailed(false); setArmed(false); setCurrent(start); setAttempt((n) => n + 1) }

  // ---- seek bar (pointer drag), drawn against the FULL lesson length ----
  const seekFromEvent = (clientX) => {
    const rect = barRef.current.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    seekTo(frac * total)
  }
  const onBarDown = (e) => {
    if (!armed) return
    barRef.current.setPointerCapture(e.pointerId)
    seekFromEvent(e.clientX)
    const move = (ev) => seekFromEvent(ev.clientX)
    const up = (ev) => {
      try { barRef.current.releasePointerCapture(ev.pointerId) } catch { /* noop */ }
      barRef.current.removeEventListener('pointermove', move)
      barRef.current.removeEventListener('pointerup', up)
    }
    barRef.current.addEventListener('pointermove', move)
    barRef.current.addEventListener('pointerup', up)
  }

  const pctOf = (t) => (total ? Math.max(0, Math.min(100, (t / total) * 100)) : 0)
  const winLeft = pctOf(start)
  const winWidth = pctOf(end) - winLeft
  const playedWidth = Math.max(0, pctOf(current) - winLeft)
  const VolIcon = muted ? IconVolMute : IconVolHigh

  return (
    <div
      ref={wrapRef}
      className="relative aspect-video w-full select-none overflow-hidden bg-nirmaan-brown"
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        ref={videoRef}
        className="h-full w-full"
        playsInline
        // MSE path: hls.js attaches a MediaSource and `autoStartLoad: false` is what
        // keeps the network quiet, so preload can stay default — "none" can stop the
        // source ever opening. Native (Safari) HLS has a real src, so it needs "none".
        preload={Hls.isSupported() ? undefined : 'none'}
        controlsList="nodownload"
        disablePictureInPicture
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onPlaying={() => { setLoading(false); setFailed(false) }}
        onWaiting={() => setLoading(true)}
        onLoadedMetadata={onLoadedMetadata}
        onDurationChange={(e) => setDuration(e.target.duration || fullSeconds)}
        onTimeUpdate={onTime}
        onVolumeChange={(e) => setMuted(e.target.muted)}
        onError={() => { setFailed(true); setLoading(false); setPlaying(false) }}
      />

      {/* Untouched card: nothing is fetched until this is pressed. */}
      {!armed && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-nirmaan-brown text-white transition-colors hover:bg-nirmaan-brown-soft"
          aria-label="Play the free preview"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30">
            <IconPlay className="h-6 w-6" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-white/80">
            Free preview · {fmt(end - start)} of {fmt(fullSeconds)}
          </span>
        </button>
      )}

      {armed && loading && !failed && !locked && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-white/85">Loading the video…</p>
      )}

      {armed && !playing && !loading && !failed && !locked && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Play"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/45 text-white">
            <IconPlay className="h-6 w-6" />
          </span>
        </button>
      )}

      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-nirmaan-brown px-6 text-center">
          <p className="text-sm font-semibold text-white">We could not load this preview</p>
          <p className="text-xs text-white/75">This is a problem at our end, not with your connection.</p>
          <button type="button" onClick={retry} className="mt-1 rounded-md bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25">
            Try again
          </button>
        </div>
      )}

      {/* The whole point of the section: it stops exactly where they want more. */}
      {locked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-nirmaan-brown/92 px-5 text-center">
          <span className="text-white/70"><IconLock className="h-6 w-6" /></span>
          <p className="font-display text-base font-bold text-white">That’s the free preview</p>
          <p className="text-xs leading-relaxed text-white/80">
            {fmt(Math.max(0, total - end))} more in this lesson, and 23 more weeks after it.
          </p>
          <a
            href={ctaHref}
            className="mt-2 inline-flex h-9 items-center justify-center rounded-lg bg-nirmaan-green px-4 text-sm font-semibold text-white transition-colors hover:bg-nirmaan-green-dark"
          >
            Start the free trial
          </a>
          <button type="button" onClick={replay} className="mt-1 text-xs font-medium text-white/70 underline-offset-2 hover:underline">
            Watch the preview again
          </button>
        </div>
      )}

      {/* Control bar — the track spans the FULL lesson; only the lit band plays.
          Hidden once the window runs out, so it cannot sit under the CTA. */}
      {armed && !failed && !locked && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6">
          <div
            ref={barRef}
            onPointerDown={onBarDown}
            className="relative h-1.5 w-full cursor-pointer rounded-full bg-white/25"
            role="presentation"
          >
            <div className="absolute inset-y-0 rounded-full bg-nirmaan-green-light/60" style={{ left: `${winLeft}%`, width: `${winWidth}%` }} />
            <div className="absolute inset-y-0 rounded-full bg-nirmaan-green-light" style={{ left: `${winLeft}%`, width: `${playedWidth}%` }} />
            <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" style={{ left: `${pctOf(current)}%` }} />
            <span
              className="absolute top-1/2 -translate-y-1/2 text-white/70"
              style={{ left: `calc(${pctOf(end)}% + 8px)` }}
              title="The rest of this lesson is in the course"
            >
              <IconLock className="h-3 w-3" />
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-2 text-white">
            <button type="button" onClick={togglePlay} className="p-1 hover:opacity-80" aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? <IconPause className="h-4 w-4" /> : <IconPlay className="h-4 w-4" />}
            </button>
            <button type="button" onClick={toggleMute} className="p-1 hover:opacity-80" aria-label={muted ? 'Unmute' : 'Mute'}>
              <VolIcon className="h-4 w-4" />
            </button>
            <span className="text-xs tabular-nums text-white/85">{fmt(current)} / {fmt(total)}</span>
            <span className="ml-auto text-[11px] font-semibold uppercase tracking-wide text-white/60">Free preview</span>
            <button type="button" onClick={toggleFull} className="p-1 hover:opacity-80" aria-label={full ? 'Exit fullscreen' : 'Fullscreen'}>
              {full ? <IconExitFullscreen className="h-4 w-4" /> : <IconFullscreen className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
