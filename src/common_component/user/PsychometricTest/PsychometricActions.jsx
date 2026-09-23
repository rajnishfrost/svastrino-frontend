import { useEffect, useState } from 'react'
import { api } from '../../../api/client.js'
import TestDetailsModal from './TestDetailsModal.jsx'
import './PsychometricTest.css'

/**
 * What a student can do about their psychometric test, wherever they meet it:
 * the course page's gate and the psychometric page both render this, so taking
 * the test, finishing it and opening the report work the same in either place.
 *
 * Driven by the assessment's status:
 *   not_started  "Take the test"
 *   in_progress  "Continue your test" + "I've finished it"
 *   submitted    "See your report" — the report lives on the test site (My
 *                Report / My Result), so this signs them in there the same
 *                way "Take the test" does
 *   completed    the same, or "View your report" for an older record that an
 *                admin attached a report to back when we re-hosted them
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
export default function PsychometricActions({ product, assessment, onChange, onFinished }) {
  const [busy, setBusy] = useState(false)
  // True from the click until the browser leaves for the test.
  const [opening, setOpening] = useState(false)
  const [askDetails, setAskDetails] = useState(false)
  const [err, setErr] = useState('')

  const status = assessment?.status || 'not_started'
  const apiMode = assessment?.mode === 'api'

  const reload = () =>
    api(`/user/assessment/${product}`, { auth: 'user' }).then((d) => { onChange?.(d); return d })

  // Coming Back from the test site can restore this page from the browser's
  // back/forward cache exactly as it was left — loader up, buttons disabled.
  // Clear that, and re-read the status so "I've finished it" is on offer.
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

  // Anything the test still needs from the profile is asked for first.
  const openTest = () => {
    setErr('')
    if (apiMode && assessment?.needs?.length) return setAskDetails(true)
    return goToTest()
  }

  const goToTest = async () => {
    setErr(''); setBusy(true); setOpening(true)
    try {
      const a = await api(`/user/assessment/${product}/start`, { method: 'POST', auth: 'user' })
      onChange?.(a)
      if (a.redirectUrl) {
        // Signed in on the test site already; the link lands them in the test.
        // Same tab — the loader stays up until the page goes.
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
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  const reportUrl = assessment?.report?.url
  // After the test, the same sign-in takes them to their results instead.
  const done = status === 'submitted' || (status === 'completed' && !reportUrl)

  return (
    <>
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

      {err && <p className="ptest-err">{err}</p>}

      <div className="ptest-actions">
        {(status === 'not_started' || status === 'in_progress') && (
          <button type="button" className="btn btn-primary" onClick={openTest} disabled={busy}>
            {opening ? 'Opening…' : status === 'not_started' ? 'Take the test' : 'Continue your test'}
          </button>
        )}
        {status === 'in_progress' && (
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
