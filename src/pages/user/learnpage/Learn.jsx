import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { readResume, writeResume, readDraft, writeDraft, clearDraft, readPlays, writePlays } from '../../../utils/resume.js'
import { api } from '../../../api/client.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import { downloadVideo, removeDownload, getDownloadInfo, listQualities, fmtMB } from '../../../utils/offlineVideo.js'
import { enqueue, flush, pendingCount, pendingWithPrefix, onOutboxChange } from '../../../utils/outbox.js'
import HlsPlayer from './HlsPlayer.jsx'
import CourseExpired from './sections/CourseExpired.jsx'
import PsychometricGate from './sections/PsychometricGate.jsx'
import './Learn.css'

/**
 * Course player (SRS §4.3). Drip-scheduled: the student clicks Start (consent),
 * Video 1 opens immediately, each video needs a first 90% watch (seeking is
 * locked until then), and 6 daily questions open one per day (next opens the
 * IST-midnight after the previous is answered). Finishing all 6 opens the next
 * video the following day. A report tracks target vs actual days.
 */
const THEME_CLASS = { nirmaan: 'theme-nirmaan' }
const inr = (paise) => '₹' + (Math.round(Number(paise) || 0) / 100).toLocaleString('en-IN')

// A higher tier reads as what it ADDS to the one the student is on, so
// "Nirmaan + Psychometric Testing" on top of "Nirmaan" is just the test. Any
// plan not named that way is simply offered under its own name.
const addOnName = (optionName, currentName) => {
  const prefix = `${currentName} + `
  return optionName.startsWith(prefix) ? optionName.slice(prefix.length) : optionName
}

// mm:ss clock for note timestamps.
const fmtClock = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`

/* Local mirror of "I watched this to 90%". Written BEFORE any network call, so
   even if the POST is lost (offline, auth blip, crash) the next course load
   sees server-vs-mirror disagreement and re-sends. DB stays source of truth. */
const VD_KEY = 'svastrino:videodone:v1'
const readVdMirror = () => { try { return JSON.parse(localStorage.getItem(VD_KEY) || '{}') } catch { return {} } }
const writeVdMirror = (m) => { try { localStorage.setItem(VD_KEY, JSON.stringify(m)) } catch { /* quota */ } }
const markWatchedLocally = (sessionId) => { const m = readVdMirror(); m[sessionId] = Date.now(); writeVdMirror(m) }
const clearWatchedLocally = (sessionId) => { const m = readVdMirror(); delete m[sessionId]; writeVdMirror(m) }

// Show unlock moments as an IST calendar date (they always fall at 00:00 IST).
const fmtIst = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata', weekday: 'short', day: '2-digit', month: 'short',
      })
    : ''

export default function Learn() {
  const { slug } = useParams()
  const { user } = useAuth()

  useEffect(() => {
    const cls = THEME_CLASS[slug]
    if (cls) document.body.classList.add(cls)
    return () => { if (cls) document.body.classList.remove(cls) }
  }, [slug])

  const [course, setCourse] = useState(null)
  const [report, setReport] = useState(null)
  const [upgrade, setUpgrade] = useState(null)
  const [err, setErr] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [consent, setConsent] = useState(false)
  const [starting, setStarting] = useState(false)
  const [answerText, setAnswerText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Offline downloads (stored in the browser, never as a device file)
  const [dlPct, setDlPct] = useState(null) // null = idle, 0-100 = downloading
  const [dlErr, setDlErr] = useState('')
  const [dlTick, setDlTick] = useState(0) // bump to re-read the download index
  const [online, setOnline] = useState(navigator.onLine)
  const [qualities, setQualities] = useState(null) // quality choices before saving
  const [pending, setPending] = useState(pendingCount()) // writes waiting to sync
  const [syncNote, setSyncNote] = useState('')
  const videoRef = useRef(null)
  const fired = useRef(null) // session whose 90% mark already fired this mount
  // Which session has already been PAID for in the run of video now playing.
  // Separate from `fired` because the two answer different questions: the 90%
  // watch only has to land once ever, while a play is spent every time the
  // video is watched through. Cleared when the student goes back to the start
  // (see onTimeUpdate), so a second watch costs a second play.
  const charged = useRef(null)
  const [searchParams] = useSearchParams()
  const wantedSession = searchParams.get('session') // e.g. the Play button on My downloads
  const qRef = useRef(null)      // the questions panel, so the page can land on it
  const landed = useRef(false)   // ...but only once per visit
  const posRef = useRef({ local: -999, server: -999 }) // last saved video positions (s)

  const pickDefault = (sessions) => {
    const openIncomplete = sessions.find((s) => !s.videoLocked && !s.completed)
    const open = sessions.find((s) => !s.videoLocked)
    return (openIncomplete || open || sessions[0])?.id || null
  }

  // Self-heal: if the mirror says a video was watched but the server disagrees,
  // the write was lost — re-send it (idempotent) and refresh once it lands.
  const reconcileWatches = async (c) => {
    const mirror = readVdMirror()
    let queued = false
    for (const s of c.sessions) {
      if (s.videoDone) { if (mirror[s.id]) clearWatchedLocally(s.id); continue }
      if (mirror[s.id] && !s.videoLocked) {
        enqueue({ key: `videodone:${s.id}`, path: `/user/learn/sessions/${s.id}/video-done` })
        queued = true
      }
    }
    if (queued && navigator.onLine) {
      const { sent } = await flush().catch(() => ({ sent: 0 }))
      if (sent) {
        const fresh = await api(`/user/learn/${slug}`, { auth: 'user' }).catch(() => null)
        if (fresh) {
          setCourse(fresh)
          setReport(await api(`/user/learn/${slug}/report`, { auth: 'user' }).catch(() => null))
        }
      }
    }
  }

  /**
   * Once a video's offline plays have all reached the server (or been rejected
   * as over the limit), the server's count is the truth again. Without this the
   * mirror would keep leading forever, and a queued play the outbox eventually
   * abandons would cost the student one they never got to use.
   */
  const reconcilePlays = (c) => {
    for (const s of c.sessions) {
      if (!pendingWithPrefix(`play:${s.id}:`)) writePlays(user?.id, s.id, s.plays || 0)
    }
  }

  const load = async () => {
    try {
      const c = await api(`/user/learn/${slug}`, { auth: 'user' })
      setCourse(c)
      setActiveId((prev) => {
        if (prev) return prev
        // A link that names a session - the Play button on My downloads - opens
        // THAT video, not whichever one the schedule would have picked.
        const wanted = wantedSession && c.sessions.find((x) => x.id === wantedSession && !x.videoLocked)
        return wanted?.id || pickDefault(c.sessions)
      })
      if (c.started) setReport(await api(`/user/learn/${slug}/report`, { auth: 'user' }))
      reconcileWatches(c) // fire-and-forget repair of any lost 90%-watch
      reconcilePlays(c)
    } catch (e) {
      // A network failure has no `.status`. Offline we must NOT replace the page
      // with an error — the student may be here to watch a downloaded video.
      const offlineFail = typeof e?.status !== 'number'
      if (offlineFail && course) return // keep whatever we already have on screen
      setErr({ message: e.message, code: e.code })
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [slug])

  // Whether the student can still upgrade to a higher package. The window is
  // counted from the day they START the course, so this is re-read after Start.
  const loadUpgrade = () =>
    api(`/user/payments/upgrade-status?product=${slug}`, { auth: 'user' })
      .then(setUpgrade)
      .catch(() => {})

  useEffect(() => { loadUpgrade() /* eslint-disable-next-line */ }, [slug])

  const active = course?.sessions.find((s) => s.id === activeId)

  const playLimit = course?.playLimit ?? 5
  // What the limit is judged against: the server's count, or this browser's
  // when it is ahead because plays made offline have not been replayed yet.
  const playsUsed = (s) => (s ? Math.max(s.plays || 0, readPlays(user?.id, s.id)) : 0)
  const playsLeftFor = (s) => Math.max(0, playLimit - playsUsed(s))
  const withPlays = (c, sessionId, plays) => ({
    ...c,
    sessions: c.sessions.map((s) => (s.id === sessionId
      ? { ...s, plays, playsLeft: Math.max(0, playLimit - plays), playLimitReached: plays >= playLimit }
      : s)),
  })

  // The answer box keeps what the student typed. Leaving mid-answer - the tab
  // closed, the phone locked, a refresh - used to lose it; now the draft comes
  // back with the question, and goes only when the answer is sent.
  const currentQid = active?.questions?.current?.id || null
  useEffect(() => {
    setAnswerText(currentQid ? readDraft(user?.id, currentQid) : '')
  }, [currentQid, user?.id])
  useEffect(() => {
    if (!currentQid) return
    const t = setTimeout(() => writeDraft(user?.id, currentQid, answerText), 400)
    return () => clearTimeout(t)
  }, [answerText, currentQid, user?.id])

  // Land on the open task when there is one. The schedule already picks the
  // week; this brings the question into view, so a student who left half-way
  // through a task comes back to the task and not to the top of the page.
  // Not when they came for a specific video (a ?session link) - then the
  // video is the point.
  useEffect(() => {
    if (landed.current || wantedSession || !active?.videoDone || !active?.questions?.current) return
    landed.current = true
    const t = setTimeout(() => qRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
    return () => clearTimeout(t)
  }, [active, wantedSession])

  // Where to offer resuming from: the later of what this browser remembers and
  // what the server has (they may have got further on another device).
  const startAt = useMemo(() => {
    if (!active) return 0
    const local = readResume(user?.id, active.id)
    const serverAt = active.resumeUpdatedAt ? new Date(active.resumeUpdatedAt).getTime() : 0
    if (local && local.at >= serverAt) return local.s
    return active.resumeAt || 0
  }, [active?.id, active?.resumeAt, active?.resumeUpdatedAt, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { posRef.current = { local: -999, server: -999 } }, [activeId])

  // The step up the banner talks about: the cheapest tier above the one they
  // own (upgrade-status sorts them by price).
  const nextUp = upgrade?.options?.[0] || null

  // Track connectivity; on reconnect, push any queued writes then refresh so the
  // page reflects the synced progress.
  useEffect(() => {
    const up = async () => {
      setOnline(true)
      const { sent } = await flush().catch(() => ({ sent: 0 }))
      setPending(pendingCount())
      if (sent) { setSyncNote(''); await load() }
    }
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    const off = onOutboxChange(setPending)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
      off()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-read the download index whenever the session changes or we save/remove.
  const dlInfo = useMemo(
    () => (active?.videoUrl ? getDownloadInfo(active.videoUrl) : null),
    [active?.videoUrl, dlTick],
  )

  // Step 1 — ask which quality (with a size estimate) before saving.
  const openQualityPicker = async () => {
    if (!active?.videoUrl) return
    setDlErr('')
    try {
      const list = await listQualities(active.videoUrl, (active.durationMins || 0) * 60)
      if (!list.length) return saveOffline(null) // plain MP4 — nothing to choose
      setQualities(list)
    } catch (e) {
      setDlErr(e.message)
    }
  }

  // Step 2 — save the chosen rung.
  const saveOffline = async (height) => {
    if (!active?.videoUrl) return
    setQualities(null)
    setDlErr(''); setDlPct(0)
    try {
      await downloadVideo(active.videoUrl, {
        height,
        maxHeight: 480,
        onProgress: (p) => setDlPct(p),
        // Stored with the download so /downloads can render without any network.
        meta: {
          slug,
          sessionId: active.id,
          title: active.title,
          course: course?.skillBuild?.name || '',
          durationMins: active.durationMins,
        },
      })
      setDlTick((t) => t + 1)
    } catch (e) {
      setDlErr(e.message)
    } finally {
      setDlPct(null)
    }
  }
  const dropOffline = async () => {
    if (!active?.videoUrl) return
    await removeDownload(active.videoUrl)
    setDlTick((t) => t + 1)
  }

  // Jump the video to a note's timestamp. On the first watch the seek-lock will
  // snap a forward jump back — after the 90% watch, notes jump freely.
  const seekTo = (t) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = t
    v.play?.().catch(() => {})
  }

  const startCourse = async () => {
    // Not queueable: the server's response builds the session list and it starts
    // the upgrade window — so this one genuinely needs a connection.
    if (!navigator.onLine) {
      setErr({ message: 'Starting a course needs an internet connection. Please reconnect and try again.' })
      return
    }
    setStarting(true)
    try {
      const c = await api(`/user/learn/${slug}/start`, { method: 'POST', auth: 'user' })
      setCourse(c)
      setActiveId(pickDefault(c.sessions))
      setConsent(false)
      setReport(await api(`/user/learn/${slug}/report`, { auth: 'user' }))
      loadUpgrade() // the 7-day upgrade window starts now
    } catch (e) {
      setErr({ message: e.message })
    } finally {
      setStarting(false)
    }
  }

  // First time the video passes 90% → record it (unlocks seeking + schedules Q1).
  // Offline (downloaded video) we queue it instead of losing it.
  const onVideoDone = async () => {
    if (!active || active.videoDone || fired.current === active.id) return
    fired.current = active.id
    markWatchedLocally(active.id) // mirror FIRST — survives any network/auth failure
    const path = `/user/learn/sessions/${active.id}/video-done`
    try {
      await api(path, { method: 'POST', auth: 'user' })
      await load()
    } catch {
      // NEVER lose a watch — queue it whatever the failure (offline, auth blip,
      // server hiccup). flush() replays it and only drops a permanent rejection.
      enqueue({ key: `videodone:${active.id}`, path })
      setPending(pendingCount())
    }
  }
  /**
   * Count one play. The five plays are five in TOTAL — a video watched from a
   * download costs the same as one streamed — so a play made offline is burned
   * here immediately and queued for the server, rather than being free because
   * nobody could be told about it. Returns false when they are spent, so the
   * player stops the video.
   */
  /**
   * May this video start? Asked the moment playback begins, and it spends
   * nothing — a student who opens a video by accident, or clicks a link and
   * changes their mind four seconds in, used to be charged a play for it.
   * The play is spent at the 90% mark instead (countPlay).
   *
   * Offline there is nobody to ask, so the local count decides; the queued
   * play still reaches the server later.
   */
  const allowPlay = async (sessionId) => {
    const session = course?.sessions.find((s) => s.id === sessionId)
    if (playsUsed(session) >= playLimit) return false
    try {
      await api(`/user/learn/sessions/${sessionId}/play-check`, { method: 'POST', auth: 'user' })
      return true
    } catch (e) {
      if (e.code === 'PLAY_LIMIT_REACHED' || e.code === 'PHASE_LOCKED' || e.code === 'PSYCHOMETRIC_PENDING') return false
      return true // offline or a server stumble is not the student's fault
    }
  }

  const countPlay = async (sessionId) => {
    const session = course?.sessions.find((s) => s.id === sessionId)
    if (playsUsed(session) >= playLimit) return false

    // Spend it before the request: offline there is no reply to wait for, and
    // the student is watching either way.
    const spent = playsUsed(session) + 1
    writePlays(user?.id, sessionId, spent)
    setCourse((c) => c && withPlays(c, sessionId, spent))

    const path = `/user/learn/sessions/${sessionId}/play`
    try {
      const r = await api(path, { method: 'POST', auth: 'user' })
      writePlays(user?.id, sessionId, r.plays) // the server holds the real count
      setCourse((c) => c && withPlays(c, sessionId, r.plays))
      return true
    } catch (e) {
      if (e.code === 'PLAY_LIMIT_REACHED' || e.code === 'PHASE_LOCKED') return false
      // Offline, or the server stumbled. Queue it under a key of its own —
      // unlike a 90% watch, which only has to land once, EVERY play has to be
      // counted, so these must not overwrite each other.
      enqueue({ key: `play:${sessionId}:${Date.now()}`, path })
      setPending(pendingCount())
      return true
    }
  }

  // ---- where the student is in the video ----
  // Written to this browser every ~5s of playback and to the server every
  // ~15s, and to both the moment the video is paused or the page is left. A
  // video watched to the end is stored as 0: there is nothing left to resume.
  const positionOf = (v) => {
    if (!v?.duration) return null
    if (v.ended || v.currentTime / v.duration >= 0.97) return 0 // finished → nothing to resume
    const sec = Math.floor(v.currentTime)
    // Under a few seconds there is nothing worth remembering - and the tick a
    // browser fires at 0:00 while the video loads must not wipe a real one.
    return sec >= 3 ? sec : null
  }
  const trackPosition = (v, flush = false) => {
    const sec = positionOf(v)
    if (sec == null || !active) return
    const { local, server } = posRef.current
    if (flush || sec === 0 || Math.abs(sec - local) >= 5) {
      writeResume(user?.id, active.id, sec)
      posRef.current.local = sec
    }
    if ((flush || sec === 0 || Math.abs(sec - server) >= 15) && navigator.onLine) {
      posRef.current.server = sec
      api(`/user/learn/sessions/${active.id}/position`,
        { method: 'POST', auth: 'user', body: { seconds: sec }, keepalive: flush })
        .catch(() => { posRef.current.server = -999 }) // try again on the next tick
    }
  }
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const flush = () => trackPosition(v, true)
    const onHide = () => { if (document.hidden) flush() }
    v.addEventListener('pause', flush)
    v.addEventListener('ended', flush)
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flush)
    return () => {
      v.removeEventListener('pause', flush)
      v.removeEventListener('ended', flush)
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', flush)
    }
  }, [activeId]) // eslint-disable-line react-hooks/exhaustive-deps

  const onTimeUpdate = (e) => {
    const v = e.target
    if (!active) return
    trackPosition(v)
    if (!v.duration) return
    const through = v.currentTime / v.duration

    // Watched through → this is what a "play" means now. Counting it at the
    // start charged people for videos they never watched: a mis-click, a link
    // opened and abandoned, a tab left running. Nothing is spent until the
    // student has actually been through the video.
    if (through >= 0.9 && charged.current !== active.id) {
      charged.current = active.id
      countPlay(active.id)
    }
    // Back near the beginning means they are watching it again, and the next
    // time they reach the end that is a second play.
    if (through < 0.25) charged.current = null

    if (active.videoDone) return
    if (through >= 0.9) onVideoDone()
  }

  const submitAnswer = async (questionId) => {
    if (!answerText.trim()) return
    setSubmitting(true)
    const path = `/user/learn/questions/${questionId}/answer`
    const body = { text: answerText.trim() }
    try {
      await api(path, { method: 'POST', auth: 'user', body })
      clearDraft(user?.id, questionId)
      setAnswerText('')
      await load()
    } catch (e) {
      if (typeof e?.status !== 'number') {
        // Offline — keep the answer and send it when the connection is back.
        enqueue({ key: `answer:${questionId}`, path, body })
        setPending(pendingCount())
        clearDraft(user?.id, questionId)
        setAnswerText('')
        setSyncNote('Saved — this will sync when you\'re back online.')
      } else {
        setErr({ message: e.message })
      }
    } finally { setSubmitting(false) }
  }

  // ---- Errors / loading ----
  if (err?.code === 'NOT_ENROLLED') {
    return (
      <section className="section"><div className="container learn-wrap">
        <div className="card learn-gate">
          <h1>Enrol to start learning</h1>
          <p>You haven't purchased this course yet. Pick a package to unlock the lectures.</p>
          <Link to="/skill-build/nirmaan#packages" className="btn btn-primary">View packages</Link>
        </div>
      </div></section>
    )
  }
  // Offline with nothing cached for this course — point them at what they saved
  // instead of showing a raw network error.
  if (err && !online && !course) {
    return (
      <section className="section"><div className="container learn-wrap">
        <div className="card learn-gate">
          <h1>You're offline</h1>
          <p>This course hasn't been saved for offline use. Reconnect to continue, or open a video you already saved.</p>
          <Link to="/dashboard/downloads" className="btn btn-primary">My downloads</Link>
        </div>
      </div></section>
    )
  }
  // The year can run out while the student is mid-answer. The server refuses
  // that write with COURSE_EXPIRED, and the kind reply is the record screen
  // rather than one red line where the course used to be.
  if (err?.code === 'COURSE_EXPIRED' && course) {
    return <CourseExpired course={course} user={user} slug={slug} />
  }
  if (err) return <section className="section"><div className="container learn-wrap"><p className="learn-err">{err.message}</p></div></section>
  if (!course) return <section className="section"><div className="container learn-wrap"><p>Loading course…</p></div></section>

  // ---- The year is up → their record, not the player ----
  // The server has already shut the videos and the tasks by this point, so
  // showing the player would only be a door that opens onto a 403. This says
  // the same thing in plain words and hands the student their own work.
  if (course.access && course.access.state !== 'active') {
    return <CourseExpired course={course} user={user} slug={slug} />
  }

  // ---- Not started yet → Start screen + consent ----
  if (!course.started) {
    return (
      <section className="section learn-start-section"><div className="container learn-wrap">
        <div className="card learn-start">
          <p className="learn-eyebrow">Skill Build</p>
          <h1>{course.skillBuild.name}</h1>
          <p className="learn-start-sub">
            {course.packageName} plan · {course.sessions.length} sessions. One video opens each week,
            with 6 short questions that unlock one per day.
          </p>
          <p className="learn-start-motiv">
            💪 Finish each task within its time — staying on schedule builds a strong track record on your journey.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => setConsent(true)}>Start course</button>
        </div>

        {consent && (
          <div className="learn-modal" role="dialog" aria-modal="true">
            <div className="learn-modal-card">
              <h3>Ready to begin?</h3>
              <p>
                Once you start, <strong>Video 1 opens right away</strong>. After you watch it, a question
                opens <strong>every day</strong> — six in all — and the next video opens once you've answered them.
              </p>
              <p className="learn-modal-note">
                Be consistent: there's no penalty for a break, but every day you skip pushes your schedule
                later — and your completion report records how many days you took.
              </p>
              <div className="learn-modal-actions">
                <button type="button" className="btn btn-primary" onClick={startCourse} disabled={starting}>
                  {starting ? 'Starting…' : 'I understand — start now'}
                </button>
                <button type="button" className="settings-link" onClick={() => setConsent(false)} disabled={starting}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div></section>
    )
  }

  const { progress } = course

  return (
    <section className="section">
      <div className="container learn-wrap">
        {/* The server was started with LEARN_TEST_MODE on: the daily wait between
            tasks is gone and the video can be skipped through. Said out loud on
            the page so a test server is never mistaken for a real one. */}
        {course.testMode && (
          <div className="learn-testmode" role="note">
            <strong>Test mode is on.</strong> Tasks open the moment the one before
            them is finished — no waiting for the next day — the play limit is off,
            and you can skip forward in the video. This is not how a student sees
            the course. Turn it off by removing <code>LEARN_TEST_MODE</code> from
            the server env and restarting.
          </div>
        )}
        {upgrade?.canUpgrade && nextUp && (
          <div className="learn-upgrade" role="note">
            <div className="learn-upgrade-info">
              <p className="learn-upgrade-title">Upgrade your plan</p>
              <p className="learn-upgrade-sub">
                You're on <strong>{upgrade.currentPackage.name}</strong>. Add{' '}
                <strong>{addOnName(nextUp.name, upgrade.currentPackage.name)}</strong> for{' '}
                <strong>{inr(nextUp.amount)}</strong>
                {nextUp.listAmount > nextUp.amount && <> instead of {inr(nextUp.listAmount)}</>} —{' '}
                {upgrade.courseStarted ? (
                  <>
                    offer ends in{' '}
                    <strong>
                      {upgrade.daysLeft} day{upgrade.daysLeft === 1 ? '' : 's'}
                    </strong>.
                  </>
                ) : (
                  <>offer runs <strong>{upgrade.windowDays} days</strong> from the day you start the course.</>
                )}
              </p>
            </div>
            <div className="learn-upgrade-actions">
              {upgrade.options.map((o) => (
                <Link key={o.packageId} to={`/checkout?pkg=${o.packageId}`} className="btn btn-primary learn-upgrade-btn">
                  {upgrade.options.length === 1
                    ? 'Book Now'
                    : `Book Now · ${addOnName(o.name, upgrade.currentPackage.name)}`}
                </Link>
              ))}
            </div>
          </div>
        )}
        <header className="learn-head">
          <div>
            <p className="learn-eyebrow">Skill Build</p>
            <h1>{course.skillBuild.name}</h1>
          </div>
          <div className="learn-progress">
            <div className="learn-progress-track"><span style={{ width: `${progress.percent}%` }} /></div>
            <span className="learn-progress-label">{progress.completed}/{progress.total} · {progress.percent}%</span>
          </div>
        </header>

        {!online && (
          <p className="learn-offline-banner">
            📴 You're offline — showing your saved content. Downloaded videos will play
            {pending > 0
              ? `; ${pending} change${pending > 1 ? 's' : ''} will sync when you're back.`
              : '; your progress will sync when you\'re back.'}
          </p>
        )}
        {online && pending > 0 && (
          <p className="learn-offline-banner">🔄 Syncing {pending} saved change{pending > 1 ? 's' : ''}…</p>
        )}

        {course.psychometric?.blocks && (
          <PsychometricGate slug={slug} status={course.psychometric.status} onDone={load} />
        )}

        {report && <ReportStrip report={report} />}

        <div className="learn-grid">
          {/* Session list */}
          <aside className="learn-sidebar">
            <ol className="learn-list">
              {course.sessions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`learn-item${s.id === activeId ? ' is-active' : ''}`}
                    disabled={s.videoLocked}
                    onClick={() => setActiveId(s.id)}
                  >
                    <span className={`learn-item-ico learn-item-ico--${s.completed ? 'done' : s.videoLocked ? 'locked' : 'open'}`}>
                      {s.completed ? '✓' : s.videoLocked ? '🔒' : s.order}
                    </span>
                    <span className="learn-item-main">
                      <span className="learn-item-title">{s.title}</span>
                      <span className="learn-item-meta">
                        {/* Two different locks, and saying the wrong one is worse
                            than saying nothing. The drip clock has a date to
                            show; a week that has not been paid for has none —
                            the server sends videoUnlockAt as null there — and
                            "Opens " with nothing after it reads as a bug. */}
                        {s.phaseLocked
                          ? 'In the full course'
                          : s.videoLocked
                            ? `Opens ${fmtIst(s.videoUnlockAt)}`
                            : `${s.durationMins} min · ${s.questions.answeredCount}/${s.questions.total} Q`}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </aside>

          {/* Player + questions */}
          <main className="learn-main">
            {active && (
              <>
                <HlsPlayer key={active.id} src={active.videoUrl} videoRef={videoRef}
                           onTimeUpdate={onTimeUpdate} startAt={startAt}
                           lockSeek={!active.videoDone && !course.testMode}
                           watermark={user?.email || ''} captions={active.captions || []}
                           onFirstPlay={() => allowPlay(active.id)}
                           playBlockedMessage={`You have watched this video the maximum of ${playLimit} times.`} />
                {!active.videoDone && !course.testMode && (
                  <p className="learn-seek-note">🔒 Watch to 90% once to unlock skipping ahead on this video.</p>
                )}
                {active.playsLeft != null && !course.testMode && (
                  <p className="learn-plays-note">
                    {playsLeftFor(active) > 0
                      ? `${playsLeftFor(active)} of ${playLimit} plays left for this video.`
                      : 'You have used all the plays for this video.'}
                  </p>
                )}

                {/* Offline: saved inside the app — never as a file on the device */}
                <div className="learn-offline">
                  {dlPct !== null ? (
                    <>
                      <span className="learn-offline-track"><span style={{ width: `${dlPct}%` }} /></span>
                      <span className="learn-offline-txt">Saving… {dlPct}%</span>
                    </>
                  ) : dlInfo ? (
                    <>
                      <span className="learn-offline-ok">
                        ✓ Available offline{dlInfo.bytes ? ` · ${fmtMB(dlInfo.bytes)}` : ''}
                      </span>
                      <Link to="/dashboard/downloads" className="learn-offline-link">My downloads</Link>
                      <button type="button" className="settings-link" onClick={dropOffline}>Remove</button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="learn-offline-btn" onClick={openQualityPicker}>⤓ Save for offline</button>
                      <span className="learn-offline-txt">
                        Plays without internet, inside this site only — nothing is saved as a
                        file on your device. It is kept in this browser's storage for this
                        site, and you can find it any time under{' '}
                        <Link to="/dashboard/downloads" className="learn-offline-link">My downloads</Link>
                        {' '}(also in your profile menu). It stays on this browser only, so
                        clearing this site's data — or opening the course on another device —
                        means saving it again.
                      </span>
                    </>
                  )}
                  {dlErr && <span className="learn-err">{dlErr}</span>}
                </div>

                {/* Choose the quality to save (smaller = less storage) */}
                {qualities && (
                  <div className="learn-qpick">
                    <p className="learn-qpick-title">Save at which quality?</p>
                    <div className="learn-qpick-row">
                      {qualities.map((q) => (
                        <button key={q.height} type="button" className="learn-qpick-btn" onClick={() => saveOffline(q.height)}>
                          <strong>{q.height}p</strong>
                          {q.bytes ? <span>≈ {fmtMB(q.bytes)}</span> : null}
                        </button>
                      ))}
                    </div>
                    <button type="button" className="settings-link" onClick={() => setQualities(null)}>Cancel</button>
                  </div>
                )}

                {active.notes?.length > 0 && (
                  <div className="learn-notes">
                    <h3 className="learn-notes-title">Notes</h3>
                    <ul className="learn-notes-list">
                      {active.notes.map((n, i) => (
                        <li key={i} className="learn-note">
                          <button type="button" className="learn-note-time" onClick={() => seekTo(n.time)}>{fmtClock(n.time)}</button>
                          <span className="learn-note-text">{n.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <h2 className="learn-title">{active.title}</h2>
                <p className="learn-desc">{active.description}</p>

                {/* Questions — right below the video */}
                {syncNote && <p className="learn-syncnote">📥 {syncNote}</p>}
                <div ref={qRef}>
                  <QuestionsPanel
                    session={active}
                    answerText={answerText}
                    setAnswerText={setAnswerText}
                    submitting={submitting}
                    onSubmit={submitAnswer}
                  />
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </section>
  )
}

/* ---------- Questions (video ke neeche) ---------- */
function QuestionsPanel({ session, answerText, setAnswerText, submitting, onSubmit }) {
  const q = session.questions
  const total = q.total
  if (total === 0) return null

  let body
  if (!session.videoDone) {
    body = <p className="learn-q-msg">Finish watching the video (90%) to unlock Question 1 — it opens the next day.</p>
  } else if (q.sessionCompleted) {
    body = <p className="learn-q-msg learn-q-msg--done">✓ All {total} questions done. {session.completed ? 'The next video opens tomorrow.' : ''}</p>
  } else if (q.current) {
    body = (
      <div className="learn-q-card">
        <p className="learn-q-num">Question {q.current.order} of {total}</p>
        <p className="learn-q-prompt">{q.current.prompt}</p>
        {/* The course sheet writes a worked answer for every task. It goes in
            the placeholder rather than above the box: the tasks are open-ended
            ("write three things you are grateful for"), and showing the shape
            of an answer where the answer goes says what is being asked while
            still leaving the box empty. */}
        <textarea
          className="learn-q-input" rows={4}
          placeholder={q.current.placeholder
            ? `For example — ${q.current.placeholder}`
            : 'Type your answer…'}
          value={answerText} onChange={(e) => setAnswerText(e.target.value)}
        />
        <button type="button" className="btn btn-primary learn-q-submit"
                onClick={() => onSubmit(q.current.id)} disabled={submitting || !answerText.trim()}>
          {submitting ? 'Submitting…' : 'Submit answer'}
        </button>
      </div>
    )
  } else if (q.nextUnlockAt) {
    body = (
      <div className="learn-q-locked">
        <p className="learn-q-num">🔒 Question {q.answeredCount + 1} of {total}</p>
        <p className="learn-q-msg">Opens <strong>{fmtIst(q.nextUnlockAt)}</strong> — come back then to continue.</p>
      </div>
    )
  }

  return (
    <div className="learn-q">
      <div className="learn-q-head">
        <h3>Questions</h3>
        <span className="learn-q-count">{q.answeredCount} of {total} answered</span>
      </div>
      <div className="learn-q-dots" aria-hidden>
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={`learn-q-dot${i < q.answeredCount ? ' done' : i === q.answeredCount && q.current ? ' active' : ''}`} />
        ))}
      </div>

      {q.answered.length > 0 && (
        <details className="learn-q-past">
          <summary>Your answers ({q.answered.length})</summary>
          {q.answered.map((a) => (
            <div key={a.order} className="learn-q-pastitem">
              <p className="learn-q-pastq">{a.order}. {a.prompt}</p>
              <p className="learn-q-pasta">{a.text}</p>
            </div>
          ))}
        </details>
      )}

      {body}
    </div>
  )
}

/* ---------- Report strip (day tracking + today's task) ---------- */
function ReportStrip({ report }) {
  const done = report.actualDays != null
  const task = report.todayTask
  return (
    <div className="learn-report">
      <div className="learn-report-item">
        <span>Day</span>
        <strong>{report.daysElapsed} of {report.targetDays}</strong>
      </div>
      {done && (
        <div className="learn-report-item"><span>Completed in</span><strong>{report.actualDays} days</strong></div>
      )}
      <span className={`learn-report-badge${done ? ' is-done' : report.onTrack ? ' is-ok' : ' is-late'}`}>
        {done
          ? '✓ Completed'
          : report.onTrack
            ? 'On track'
            : `${report.behindDays} day${report.behindDays > 1 ? 's' : ''} behind · est. ${report.estimatedDays} days`}
      </span>

      {/* The SAME "what's due today" line the reminder e-mail uses */}
      {!done && task && (
        <p className="learn-report-task">
          🎯 {task.label}
          {task.type === 'waiting' && task.unlockAt ? ` — opens ${fmtIst(task.unlockAt)}` : ''}
        </p>
      )}
    </div>
  )
}
