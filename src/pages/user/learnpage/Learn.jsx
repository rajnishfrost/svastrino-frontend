import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../../../api/client.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import { downloadVideo, removeDownload, getDownloadInfo, listQualities, fmtMB } from '../../../utils/offlineVideo.js'
import { enqueue, flush, pendingCount, onOutboxChange } from '../../../utils/outbox.js'
import HlsPlayer from './HlsPlayer.jsx'
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
  const [assess, setAssess] = useState(null) // psychometric test status
  const [assessBusy, setAssessBusy] = useState(false)
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

  const load = async () => {
    try {
      const c = await api(`/user/learn/${slug}`, { auth: 'user' })
      setCourse(c)
      setActiveId((prev) => prev || pickDefault(c.sessions))
      if (c.started) setReport(await api(`/user/learn/${slug}/report`, { auth: 'user' }))
      reconcileWatches(c) // fire-and-forget repair of any lost 90%-watch
    } catch (e) {
      // A network failure has no `.status`. Offline we must NOT replace the page
      // with an error — the student may be here to watch a downloaded video.
      const offlineFail = typeof e?.status !== 'number'
      if (offlineFail && course) return // keep whatever we already have on screen
      setErr({ message: e.message, code: e.code })
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [slug])
  useEffect(() => { setAnswerText('') }, [activeId])

  // Whether the student can still upgrade to a higher package. The window is
  // counted from the day they START the course, so this is re-read after Start.
  const loadUpgrade = () =>
    api(`/user/payments/upgrade-status?product=${slug}`, { auth: 'user' })
      .then(setUpgrade)
      .catch(() => {})

  useEffect(() => { loadUpgrade() /* eslint-disable-next-line */ }, [slug])

  // Psychometric test (Mindler) — ships with every package, so every enrolled
  // student sees this. Taken on Mindler's white-label site; an admin verifies
  // and attaches the report, which flips it to 'completed'.
  const loadAssess = () =>
    api(`/user/assessment/${slug}`, { auth: 'user' }).then(setAssess).catch(() => {})

  useEffect(() => { loadAssess() /* eslint-disable-next-line */ }, [slug])

  const openTest = async () => {
    setAssessBusy(true)
    try {
      const a = await api(`/user/assessment/${slug}/start`, { method: 'POST', auth: 'user' })
      setAssess(a)
      if (a.testUrl) window.open(a.testUrl, '_blank', 'noopener')
    } catch (e) {
      setErr({ message: e.message })
    } finally {
      setAssessBusy(false)
    }
  }

  const markTestDone = async () => {
    setAssessBusy(true)
    try {
      setAssess(await api(`/user/assessment/${slug}/submitted`, { method: 'POST', auth: 'user' }))
    } catch (e) {
      setErr({ message: e.message })
    } finally {
      setAssessBusy(false)
    }
  }

  const active = course?.sessions.find((s) => s.id === activeId)

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
  const onTimeUpdate = (e) => {
    const v = e.target
    if (!active || active.videoDone) return
    if (v.duration && v.currentTime / v.duration >= 0.9) onVideoDone()
  }

  const submitAnswer = async (questionId) => {
    if (!answerText.trim()) return
    setSubmitting(true)
    const path = `/user/learn/questions/${questionId}/answer`
    const body = { text: answerText.trim() }
    try {
      await api(path, { method: 'POST', auth: 'user', body })
      setAnswerText('')
      await load()
    } catch (e) {
      if (typeof e?.status !== 'number') {
        // Offline — keep the answer and send it when the connection is back.
        enqueue({ key: `answer:${questionId}`, path, body })
        setPending(pendingCount())
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
          <p>You haven't purchased this course yet. Pick a package to unlock the sessions.</p>
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
          <Link to="/downloads" className="btn btn-primary">My downloads</Link>
        </div>
      </div></section>
    )
  }
  if (err) return <section className="section"><div className="container learn-wrap"><p className="learn-err">{err.message}</p></div></section>
  if (!course) return <section className="section"><div className="container learn-wrap"><p>Loading course…</p></div></section>

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
        {upgrade?.canUpgrade && (
          <div className="learn-upgrade" role="note">
            <div className="learn-upgrade-info">
              <p className="learn-upgrade-title">Upgrade your plan</p>
              <p className="learn-upgrade-sub">
                You're on <strong>{upgrade.currentPackage.name}</strong>. The {inr(upgrade.totalPaid)} you've
                already paid is adjusted —{' '}
                {upgrade.courseStarted ? (
                  <>
                    <strong>
                      {upgrade.daysLeft} day{upgrade.daysLeft === 1 ? '' : 's'} left
                    </strong>{' '}
                    to upgrade (window closes after that).
                  </>
                ) : (
                  <>
                    you get <strong>{upgrade.windowDays} days</strong> to upgrade once you start the course.
                  </>
                )}
              </p>
            </div>
            <div className="learn-upgrade-actions">
              {upgrade.options.map((o) => (
                <Link key={o.packageId} to={`/checkout?pkg=${o.packageId}`} className="btn btn-primary learn-upgrade-btn">
                  {o.name} · pay {inr(o.amount)}
                </Link>
              ))}
            </div>
          </div>
        )}
        {assess && (
          <div className={`learn-assess learn-assess--${assess.status}`}>
            <div className="learn-assess-info">
              <p className="learn-assess-title">
                Psychometric test
                <span className={`learn-assess-badge learn-assess-badge--${assess.status}`}>
                  {{
                    not_started: 'Not started',
                    in_progress: 'In progress',
                    submitted: 'Awaiting verification',
                    completed: 'Completed',
                  }[assess.status]}
                </span>
              </p>
              <p className="learn-assess-sub">
                {assess.status === 'completed'
                  ? 'Your 34-page career report is ready — mapping your interest, aptitude, personality, EQ and orientation.'
                  : assess.status === 'submitted'
                    ? "Thanks! We're verifying your result with Mindler and will attach your report shortly."
                    : 'Take your Mindler assessment (interest, aptitude, personality, EQ & orientation). It opens in a new tab — come back and tap “I’ve finished it” when you’re done.'}
              </p>

              {/* Sign-up steps + access code, until the report is done. */}
              {assess.status !== 'completed' && assess.steps?.length > 0 && (
                <ol className="learn-assess-steps">
                  {assess.steps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              )}
              {assess.status !== 'completed' && assess.accessCode && (
                <p className="learn-assess-access">
                  Coupon code: <code>{assess.accessCode}</code>
                  <button type="button" className="learn-assess-copy"
                          onClick={() => navigator.clipboard?.writeText(assess.accessCode)}>Copy</button>
                </p>
              )}

              {assess.status === 'completed' && assess.report?.topCareers?.length > 0 && (
                <p className="learn-assess-code">
                  Top careers: <strong>{assess.report.topCareers.join(', ')}</strong>
                </p>
              )}
              {assess.status === 'completed' && assess.report?.summary && (
                <p className="learn-assess-sub">{assess.report.summary}</p>
              )}
            </div>

            <div className="learn-assess-actions">
              {assess.status === 'completed' ? (
                assess.report?.url && (
                  <a href={assess.report.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                    View career report
                  </a>
                )
              ) : (
                <>
                  <button type="button" className="btn btn-primary" onClick={openTest} disabled={assessBusy}>
                    {assess.status === 'not_started' ? 'Take the test' : 'Reopen test'}
                  </button>
                  {assess.status !== 'submitted' && (
                    <button type="button" className="btn btn-secondary" onClick={markTestDone} disabled={assessBusy}>
                      I've finished it
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <header className="learn-head">
          <div>
            <p className="learn-eyebrow">Skill Build</p>
            <h1>{course.skillBuild.name}</h1>
            <p className="learn-plan">{course.packageName} plan · {progress.total} sessions</p>
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
                        {s.videoLocked
                          ? `Opens ${fmtIst(s.videoUnlockAt)}`
                          : `${s.durationMins} min · ${s.questions.answeredCount}/${s.questions.total} Q`}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </aside>

          {/* Player + questions + worksheet */}
          <main className="learn-main">
            {active && (
              <>
                <HlsPlayer key={active.id} src={active.videoUrl} videoRef={videoRef}
                           onTimeUpdate={onTimeUpdate} lockSeek={!active.videoDone}
                           watermark={user?.email || ''} captions={active.captions || []} />
                {!active.videoDone && (
                  <p className="learn-seek-note">🔒 Watch to 90% once to unlock skipping ahead on this video.</p>
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
                      <button type="button" className="settings-link" onClick={dropOffline}>Remove</button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="learn-offline-btn" onClick={openQualityPicker}>⤓ Save for offline</button>
                      <span className="learn-offline-txt">Plays without internet, inside this site only — no file is saved to your device.</span>
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
                <QuestionsPanel
                  session={active}
                  answerText={answerText}
                  setAnswerText={setAnswerText}
                  submitting={submitting}
                  onSubmit={submitAnswer}
                />

                {active.worksheet?.tasks?.length > 0 && (
                  <div className="learn-worksheet">
                    <h3>{active.worksheet.title || 'Worksheet'}</h3>
                    <ul>{active.worksheet.tasks.map((t, i) => <li key={i}>{t}</li>)}</ul>
                  </div>
                )}
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
        <textarea
          className="learn-q-input" rows={4} placeholder="Type your answer…"
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
      <div className="learn-report-item"><span>Sessions done</span><strong>{report.completedSessions}/{report.totalSessions}</strong></div>
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
