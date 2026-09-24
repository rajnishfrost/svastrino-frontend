import { useEffect, useState } from 'react'
import { api } from '../../../api/client.js'
import TestDetailsModal from './TestDetailsModal.jsx'
import GuideVideoModal from './GuideVideoModal.jsx'
import TestProgress from './TestProgress.jsx'
import './PsychometricTest.css'

/**
 * What a student can do about their psychometric test, wherever they meet it:
 * the course page's gate and the psychometric page both render this, so taking
 * the test, finishing it and opening the report work the same in either place.
 *
 * Driven by the assessment's status:
 *   not_started  "Take the test"
 *   in_progress  "Continue your test". In API mode there is nothing to tap
 *                when it is done: the test site's own status completes it,
 *                read every time the page asks. Handoff mode has no such
 *                signal, so there the student still taps "I've finished it".
 *   completed    "See your report" — the report lives on the test site, so
 *                this signs them in there and opens the report page. Or "View
 *                your report" for an older record that an admin attached a
 *                report to back when we re-hosted them.
 *   submitted    handoff mode's "I've finished it"; treated as done
 *
 * Guide pop-up: every time, before the student is sent off — how to take the
 * test before "Take the test" / "Continue your test", how to find the report
 * before "See your report". It plays the video set in Admin → Settings, or
 * shows the same walk-through as short steps while none is set. Its one button
 * is "Continue": to the test's questions, or to the report page.
 *
 * Taking the test: in API mode the account may first need its class and phone
 * (asked in a pop-up, then carried straight on), then the server signs the
 * student in on the test site and the browser follows that one-time link, with
 * a loader up in between. In handoff mode the white-label site opens in a new
 * tab, where the student signs up themselves.
 *
 * Props
 *   product      the course slug ('nirmaan')
 *   assessment   GET /user/assessment/:product
 *   onChange     receives a fresh assessment after anything here changes it
 *   onFinished   called once "I've finished it" is recorded
 */
// What the guide pop-up shows while no video is set for that step.
const GUIDE_STEPS = {
  test: [
    'You are signed in to the test automatically. There is no account to make and no code to type.',
    'Answer every section. There are no right or wrong answers, so go with your first instinct.',
    'You can stop and come back: tap “Continue your test” here and you pick up where you left off.',
    'When every section is done, come back here. We see that the test is complete by ourselves; there is nothing to tap.',
  ],
  report: [
    'You are signed in to the test site automatically and taken straight to your results.',
    'Step through each part of your results, then open “My Report” in the menu for your full report.',
    'Read the weekly videos against it. They are built around what your report says.',
  ],
}

/**
 * Sign the student in on the test site without showing it: its token login
 * always lands on the test itself, so to open any other page there it is
 * loaded out of sight first. It stores the session in the test site's own
 * storage and is gone once the browser moves on. Resolves shortly after the
 * page has loaded (its sign-in call takes a fraction of a second), or after a
 * few seconds regardless — the student is never kept waiting on it.
 */
function signInQuietly(url) {
  return new Promise((resolve) => {
    const frame = document.createElement('iframe')
    frame.style.display = 'none'
    frame.setAttribute('aria-hidden', 'true')
    frame.setAttribute('tabindex', '-1')
    frame.onload = () => setTimeout(resolve, 1500)
    setTimeout(resolve, 6000)
    frame.src = url
    document.body.appendChild(frame)
  })
}

export default function PsychometricActions({ product, assessment, onChange, onFinished }) {
  const [busy, setBusy] = useState(false)
  // True from the click until the browser leaves for the test.
  const [opening, setOpening] = useState(false)
  const [askDetails, setAskDetails] = useState(false)
  // 'test' | 'report' while that guide video is up, else null.
  const [guide, setGuide] = useState(null)
  const [err, setErr] = useState('')

  const status = assessment?.status || 'not_started'
  const apiMode = assessment?.mode === 'api'

  const reload = () =>
    api(`/user/assessment/${product}`, { auth: 'user' }).then((d) => { onChange?.(d); return d })

  // Coming Back from the test site can restore this page from the browser's
  // back/forward cache exactly as it was left — loader up, buttons disabled.
  // Clear that, and re-read the status — which is also what notices a test
  // finished on the test site.
  useEffect(() => {
    const onShow = (e) => {
      if (!e.persisted) return
      setOpening(false); setBusy(false)
      reload().catch(() => {})
    }
    window.addEventListener('pageshow', onShow)
    return () => window.removeEventListener('pageshow', onShow)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product])

  const reportUrl = assessment?.report?.url
  // After the test, the same sign-in takes them to their results instead.
  const done = status === 'submitted' || (status === 'completed' && !reportUrl)
  const guides = assessment?.guides || {}
  // Only while the test is under way: 0% says nothing a "Take the test" button
  // does not, and once it is done the report is the thing to show.
  const progress = assessment?.progress
  const showProgress = status === 'in_progress' && progress != null && progress > 0

  // The guide pop-up first, always.
  const openTest = () => {
    setErr('')
    setGuide(done ? 'report' : 'test')
  }

  // Anything the test still needs from the profile is asked for next.
  const proceed = () => {
    setGuide(null)
    if (apiMode && assessment?.needs?.length) return setAskDetails(true)
    return goToTest()
  }

  const goToTest = async () => {
    setErr(''); setBusy(true); setOpening(true)
    try {
      const a = await api(`/user/assessment/${product}/start`, { method: 'POST', auth: 'user' })
      onChange?.(a)
      if (a.redirectUrl) {
        // The report page: sign in there first (see signInQuietly).
        if (a.loginUrl) await signInQuietly(a.loginUrl)
        // For the test, the link itself signs them in and lands on the
        // questions. Same tab — the loader stays up until the page goes.
        window.location.assign(a.redirectUrl)
        return
      }
      if (a.testUrl) window.open(a.testUrl, '_blank', 'noopener')
      setOpening(false); setBusy(false)
    } catch (e) {
      setOpening(false); setBusy(false)
      // The page was loaded before the profile lost its class or phone (or in
      // another tab): read what is missing now and ask for it.
      if (e.code === 'PROFILE_INCOMPLETE') {
        const d = await reload().catch(() => null)
        if (d?.needs?.length) return setAskDetails(true)
      }
      setErr(e.message)
    }
  }

  const detailsSaved = async () => {
    setAskDetails(false)
    await reload().catch(() => {})
    goToTest()
  }

  const markDone = async () => {
    setErr(''); setBusy(true)
    try {
      const a = await api(`/user/assessment/${product}/submitted`, { method: 'POST', auth: 'user' })
      onChange?.(a)
      await onFinished?.()
    } catch (e) {
      setErr(e.message)
      // Not finished on the test site: refresh the card so its progress bar
      // shows the same number as the message.
      if (e.code === 'TEST_NOT_FINISHED') reload().catch(() => {})
    } finally { setBusy(false) }
  }

  return (
    <>
      {guide && (
        <GuideVideoModal
          src={guides[guide] || null}
          steps={GUIDE_STEPS[guide]}
          progress={guide === 'test' && showProgress ? progress : null}
          title={guide === 'report' ? 'How to open your report' : 'How to take the test'}
          sub={guide === 'report'
            ? 'A quick walk-through of where your report is and how to read it.'
            : 'A quick walk-through before you start.'}
          onContinue={proceed}
          onClose={() => setGuide(null)}
        />
      )}

      {askDetails && (
        <TestDetailsModal
          needs={assessment?.needs || []}
          onSaved={detailsSaved}
          onCancel={() => setAskDetails(false)}
        />
      )}

      {/* Only in API mode, where the click waits on the test site and then
          leaves this one. In handoff mode the click is instant and opens a new
          tab, so a loader would only flash. */}
      {opening && apiMode && (
        <div className="ptest-load" role="status" aria-live="polite">
          <div className="ptest-load-panel">
            <div className="ptest-load-spinner" aria-hidden />
            <p className="ptest-load-title">{done ? 'Opening your report' : 'Setting up your test'}</p>
            <p className="ptest-load-sub">
              We are signing you in to the assessment. This takes a few seconds — please keep this page open.
            </p>
          </div>
        </div>
      )}

      {showProgress && <TestProgress percent={progress} />}

      {err && <p className="ptest-err">{err}</p>}

      <div className="ptest-actions">
        {(status === 'not_started' || status === 'in_progress') && (
          <button type="button" className="btn btn-primary" onClick={openTest} disabled={busy}>
            {opening ? 'Opening…' : status === 'not_started' ? 'Take the test' : 'Continue your test'}
          </button>
        )}
        {status === 'in_progress' && !apiMode && (
          <button type="button" className="settings-link" onClick={markDone} disabled={busy}>
            {busy && !opening ? 'Saving…' : "I've finished it"}
          </button>
        )}
        {done && (
          <button type="button" className="btn btn-primary" onClick={openTest} disabled={busy}>
            {opening ? 'Opening…' : 'See your report'}
          </button>
        )}
        {status === 'completed' && reportUrl && (
          <a className="btn btn-primary" href={reportUrl} target="_blank" rel="noopener noreferrer">
            View your report
          </a>
        )}
      </div>
    </>
  )
}
