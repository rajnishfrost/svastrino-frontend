import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Hls from 'hls.js'
import {
  IconPlay, IconPause, IconVolHigh, IconVolLow, IconVolMute,
  IconGear, IconFullscreen, IconExitFullscreen, IconLock,
} from './PlayerIcons.jsx'
import './HlsPlayer.css'

/**
 * Custom YouTube-style video player over hls.js.
 *  - Adaptive HLS (auto quality by bandwidth, 144p → source max) + manual quality,
 *    speed, mute/volume, seek, time and fullscreen in one custom control bar.
 *  - Forward-seek is locked until the video has been watched to 90% once
 *    (`lockSeek`); after that, seeking is free. Notes-jumps use `videoRef`.
 *  - Best-effort protection: a moving e-mail watermark, and a pause+cover when
 *    the tab/window loses focus. (True screenshot/record blocking needs OS/DRM.)
 *  - If the video cannot be loaded the player says so in plain English and
 *    offers Try again, instead of sitting silently at 0:00 / 0:00.
 *
 * `videoRef` is owned by the parent (90%-complete tracking + notes seek).
 */
const SPEEDS = [0.5, 1, 1.5, 2]
const fmt = (s) => {
  if (!Number.isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function HlsPlayer({
  src, videoRef, onTimeUpdate, lockSeek = false, watermark = '', captions = [],
  // Anti-piracy: the parent counts plays on the server. `onFirstPlay` is called
  // once per mount, the moment playback actually starts; if it resolves false
  // the video is stopped again and `playBlockedMessage` is shown over it.
  // "Actually starts" means the `playing` event, not `play`. `play` fires the
  // instant the button is pressed, before a single byte has arrived, so a video
  // whose file is missing would otherwise spend a student's paid play without
  // ever showing them a frame.
  onFirstPlay = null, playBlockedMessage = '',
}) {
  const wrapRef = useRef(null)
  const hlsRef = useRef(null)
  const maxWatched = useRef(0) // furthest continuously-watched point (seek-lock)
  const idleTimer = useRef(null)
  const settingsRef = useRef(null) // gear button + popover, for click-outside
  const isHls = /\.m3u8($|\?)/i.test(src || '')

  const [levels, setLevels] = useState([]) // [{ i, height }]
  const [level, setLevel] = useState(-1) // -1 = Auto
  const [curHeight, setCurHeight] = useState(0) // the rung actually playing right now
  const [playing, setPlaying] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const countedRef = useRef(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [menu, setMenu] = useState(false) // gear popover open
  const [showBar, setShowBar] = useState(true)
  const [waiting, setWaiting] = useState(false)
  const [loading, setLoading] = useState(true) // fetching the file, nothing to show yet
  const [failed, setFailed] = useState(false) // the file could not be loaded at all
  const [attempt, setAttempt] = useState(0) // bumped by Try again to re-run the load
  const [full, setFull] = useState(false)
  const [covered, setCovered] = useState(false) // focus-loss cover
  const [subtitle, setSubtitle] = useState('') // '' = off, else caption lang

  // Toggle native text-track modes so only the chosen language shows.
  const chooseSubtitle = useCallback((lang) => {
    setSubtitle(lang)
    const tracks = videoRef.current?.textTracks
    if (!tracks) return
    for (let i = 0; i < tracks.length; i += 1) {
      tracks[i].mode = tracks[i].language === lang ? 'showing' : 'disabled'
    }
  }, [videoRef])

  // Re-apply the selection whenever the track list changes (new video/captions).
  useEffect(() => {
    const tracks = videoRef.current?.textTracks
    if (!tracks) return
    for (let i = 0; i < tracks.length; i += 1) {
      tracks[i].mode = tracks[i].language === subtitle ? 'showing' : 'disabled'
    }
  }, [captions, subtitle, videoRef])

  // Close the settings popover on ANY click/tap outside it (not just the gear).
  useEffect(() => {
    if (!menu) return
    const onDown = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setMenu(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [menu])

  // ---- hls.js attach ----
  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return
    setLevels([]); setLevel(-1)
    setFailed(false); setLoading(true)
    maxWatched.current = 0

    // load() matters on a retry: without it the browser happily replays the
    // cached failure instead of asking for the file again.
    if (!isHls) { video.src = src; video.load(); return }

    if (Hls.isSupported()) {
      const hls = new Hls({ capLevelToPlayerSize: true, startLevel: -1 })
      hlsRef.current = hls
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => setLevels(hls.levels.map((l, i) => ({ i, height: l.height }))))
      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, d) => {
        setLevel(hls.autoLevelEnabled ? -1 : d.level)
        setCurHeight(hls.levels[d.level]?.height || 0)
      })
      // hls.js handles its own retries and only reports `fatal` once it has run
      // out of them, so this does not fire on a merely slow connection. The
      // <video> element stays silent in this mode, which is why we listen here.
      hls.on(Hls.Events.ERROR, (_e, d) => {
        if (d?.fatal) { setFailed(true); setLoading(false); setWaiting(false) }
      })
      return () => { hls.destroy(); hlsRef.current = null }
    }
    video.src = src // Safari native HLS
    video.load()
  }, [src, attempt]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- pause + cover when the tab/window loses focus (deterrent) ----
  useEffect(() => {
    const cover = () => { videoRef.current?.pause(); setCovered(true); setMenu(false) }
    const uncover = () => setCovered(false)
    const onVis = () => (document.hidden ? cover() : uncover())
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('blur', cover)
    window.addEventListener('focus', uncover)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('blur', cover)
      window.removeEventListener('focus', uncover)
    }
  }, [videoRef])

  useEffect(() => {
    const onFs = () => setFull(document.fullscreenElement === wrapRef.current)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  // ---- seek helper (respects the first-watch forward lock) ----
  const seek = useCallback((to) => {
    const v = videoRef.current
    if (!v) return
    let t = Math.max(0, Math.min(to, v.duration || to))
    if (lockSeek && t > maxWatched.current + 0.5) t = maxWatched.current // no skipping ahead
    v.currentTime = t
  }, [lockSeek, videoRef])

  // ---- <video> event handlers ----
  const onTime = (e) => {
    const v = e.target
    if (!v.seeking && v.currentTime > maxWatched.current && v.currentTime - maxWatched.current < 1.5) {
      maxWatched.current = v.currentTime
    }
    setCurrent(v.currentTime)
    if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1))
    onTimeUpdate?.(e)
  }
  const onSeeking = (e) => {
    if (lockSeek && e.target.currentTime > maxWatched.current + 0.5) e.target.currentTime = maxWatched.current
  }
  const onMeta = (e) => { setDuration(e.target.duration || 0); e.target.playbackRate = speed; setLoading(false) }

  // The <video> element fires `error` when the file is missing, blocked or in a
  // format it cannot read. There is no timeout here on purpose: a slow
  // connection is still a working connection, and guessing would accuse a
  // student's internet of a problem that is ours.
  const onError = () => { setFailed(true); setLoading(false); setWaiting(false); setPlaying(false) }

  // Try again. Bumping `attempt` re-runs the attach effect, which re-fetches the
  // file from scratch. Nothing about the student's progress or their remaining
  // plays is touched, because a failed load never counted as a play.
  const retry = () => { setFailed(false); setLoading(true); setAttempt((n) => n + 1) }

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play?.().catch(() => {})
    else v.pause()
  }
  const toggleMute = () => { const v = videoRef.current; if (v) v.muted = !v.muted }
  const changeVol = (val) => { const v = videoRef.current; if (!v) return; v.volume = val; v.muted = val === 0 }
  const chooseQuality = (lvl) => { setLevel(lvl); if (hlsRef.current) hlsRef.current.currentLevel = lvl }
  const changeSpeed = (r) => { setSpeed(r); if (videoRef.current) videoRef.current.playbackRate = r }
  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else wrapRef.current?.requestFullscreen?.()
  }

  // ---- auto-hide the control bar while playing ----
  const wake = () => {
    setShowBar(true)
    clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => { if (playing && !menu) setShowBar(false) }, 2600)
  }
  useEffect(() => () => clearTimeout(idleTimer.current), [])

  // ---- custom seek bar (pointer drag) ----
  const barRef = useRef(null)
  const seekFromEvent = (clientX) => {
    const rect = barRef.current.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    seek(frac * (duration || 0))
  }
  const onBarDown = (e) => {
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

  const pct = duration ? (current / duration) * 100 : 0
  const bufPct = duration ? (buffered / duration) * 100 : 0
  const VolIcon = muted || volume === 0 ? IconVolMute : volume < 0.5 ? IconVolLow : IconVolHigh

  return (
    <div
      ref={wrapRef}
      className={`vp${showBar || !playing ? ' vp--bar' : ''}${full ? ' vp--full' : ''}`}
      onMouseMove={wake}
      onMouseLeave={() => { if (playing && !menu) setShowBar(false) }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        ref={videoRef}
        className="vp-video"
        playsInline
        controlsList="nodownload"
        disablePictureInPicture
        // Needed so cross-origin (CDN) caption files can load; harmless same-origin.
        crossOrigin={captions.length ? 'anonymous' : undefined}
        onClick={togglePlay}
        onPlay={() => { setPlaying(true); wake() }}
        onPause={() => { setPlaying(false); setShowBar(true) }}
        onTimeUpdate={onTime}
        onSeeking={onSeeking}
        onLoadStart={() => setLoading(true)}
        onLoadedMetadata={onMeta}
        onCanPlay={() => setLoading(false)}
        onDurationChange={(e) => setDuration(e.target.duration || 0)}
        onVolumeChange={(e) => { setMuted(e.target.muted); setVolume(e.target.volume) }}
        onWaiting={() => setWaiting(true)}
        onError={onError}
        onPlaying={async () => {
          setWaiting(false); setLoading(false); setFailed(false)
          // `playing` means frames are on screen, so this is the first moment a
          // play has genuinely happened. Counted once per mount, and the guard
          // is set before the await so a stall-and-resume cannot double-count.
          if (onFirstPlay && !countedRef.current) {
            countedRef.current = true
            const allowed = await onFirstPlay()
            if (allowed === false) {
              const v = videoRef?.current
              if (v) { v.pause(); v.currentTime = 0 }
              setPlaying(false)
              setBlocked(true)
            }
          }
        }}
      >
        {captions.map((c) => (
          <track key={c.lang} kind="subtitles" src={c.url} srcLang={c.lang} label={c.label} />
        ))}
      </video>
      {blocked && (
        <div className="vp-blocked" role="alert">
          <p>{playBlockedMessage || 'You have reached the play limit for this video.'}</p>
        </div>
      )}

      {/* moving watermark (traceability) */}
      {watermark && <div className="vp-watermark" aria-hidden>{watermark}</div>}

      {/* buffering spinner */}
      {(waiting || loading) && !covered && !failed && <div className="vp-spinner" aria-hidden />}

      {/* Still fetching the file. Says so, so that a wait never looks like a
          breakage and a breakage never looks like a wait. */}
      {loading && !failed && !covered && <p className="vp-loading">Loading the video…</p>}

      {/* big center play when paused */}
      {!playing && !covered && !failed && !loading && (
        <button type="button" className="vp-bigplay" onClick={togglePlay} aria-label="Play"><IconPlay /></button>
      )}

      {/* The video could not be loaded. Tell the student plainly whose problem
          this is, reassure them about what they have paid for, and give them
          something to press. */}
      {failed && (
        <div className="vp-failed" role="alert">
          <p className="vp-failed-head">We could not load this video</p>
          <p className="vp-failed-body">
            This is a problem at our end, not with your device or your internet.
            Your progress is saved and none of your plays for this video have
            been used.
          </p>
          <div className="vp-failed-acts">
            <button type="button" className="vp-failed-btn" onClick={retry}>Try again</button>
            <Link className="vp-failed-link" to="/support/new">Tell us about it</Link>
          </div>
        </div>
      )}

      {/* focus-loss cover */}
      {covered && (
        <div className="vp-cover">
          <p>Paused</p>
          <span>Return to this tab to keep watching</span>
        </div>
      )}

      {/* control bar */}
      <div className="vp-bar" onClick={(e) => e.stopPropagation()}>
        <div className="vp-seek" ref={barRef} onPointerDown={onBarDown}>
          <div className="vp-seek-buf" style={{ width: `${bufPct}%` }} />
          <div className="vp-seek-played" style={{ width: `${pct}%` }} />
          <div className="vp-seek-knob" style={{ left: `${pct}%` }} />
          {lockSeek && <span className="vp-lock" title="Watch to 90% to unlock skipping ahead"><IconLock /></span>}
        </div>

        <div className="vp-row">
          <button type="button" className="vp-btn" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <IconPause /> : <IconPlay />}
          </button>

          <div className="vp-vol">
            <button type="button" className="vp-btn" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}><VolIcon /></button>
            <input className="vp-vol-slider" type="range" min={0} max={1} step={0.05}
                   value={muted ? 0 : volume} onChange={(e) => changeVol(Number(e.target.value))} aria-label="Volume" />
          </div>

          <span className="vp-time">{fmt(current)} / {fmt(duration)}</span>

          <div className="vp-spacer" />

          <div className="vp-settings" ref={settingsRef}>
            <button type="button" className="vp-btn" onClick={() => setMenu((m) => !m)} aria-label="Settings"><IconGear /></button>
            {menu && (
              <div className="vp-menu">
                {levels.length > 1 && (
                  <div className="vp-menu-sec">
                    <p className="vp-menu-title">Quality</p>
                    <button className={`vp-menu-item${level === -1 ? ' on' : ''}`} onClick={() => chooseQuality(-1)}>
                      Auto{level === -1 && curHeight ? ` (${curHeight}p)` : ''}
                    </button>
                    {levels.map((l) => (
                      <button key={l.i} className={`vp-menu-item${level === l.i ? ' on' : ''}`} onClick={() => chooseQuality(l.i)}>
                        {l.height}p
                      </button>
                    ))}
                  </div>
                )}
                <div className="vp-menu-sec">
                  <p className="vp-menu-title">Speed</p>
                  {SPEEDS.map((r) => (
                    <button key={r} className={`vp-menu-item${speed === r ? ' on' : ''}`} onClick={() => changeSpeed(r)}>
                      {r}×{r === 1 ? ' (Normal)' : ''}
                    </button>
                  ))}
                </div>
                {captions.length > 0 && (
                  <div className="vp-menu-sec">
                    <p className="vp-menu-title">Subtitles</p>
                    <button className={`vp-menu-item${subtitle === '' ? ' on' : ''}`} onClick={() => chooseSubtitle('')}>Off</button>
                    {captions.map((c) => (
                      <button key={c.lang} className={`vp-menu-item${subtitle === c.lang ? ' on' : ''}`} onClick={() => chooseSubtitle(c.lang)}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button type="button" className="vp-btn" onClick={toggleFull} aria-label={full ? 'Exit fullscreen' : 'Fullscreen'}>
            {full ? <IconExitFullscreen /> : <IconFullscreen />}
          </button>
        </div>
      </div>
    </div>
  )
}
