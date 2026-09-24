import { useEffect, useState } from 'react'
import { api } from '../../../../api/client.js'
import PsychometricActions from '../../../../common_component/user/PsychometricTest/PsychometricActions.jsx'

/**
 * The course page's psychometric card whenever the test is NOT holding the
 * course shut (PsychometricGate handles that case):
 *
 *   - Finished: "Your psychometric report is ready", with "See your report" —
 *     the report-guide pop-up, then signed in on the test site's report page.
 *   - Not finished, for a student who added the test after buying the course:
 *     the test offered alongside the weeks, which stay open. Same buttons and
 *     progress bar as the gate, nothing locked.
 *
 * The student can hide it for this visit; a refresh or coming back to the page
 * brings it back.
 *
 * `required`: the course was bought with the test (so it gates). For those,
 * a status that turns out not to be finished means the gate belongs back on
 * the page — `onReopened` re-reads the course to put it there.
 */
export default function PsychometricReady({ slug, required = false, onReopened }) {
  const [assess, setAssess] = useState(null)
  const [hidden, setHidden] = useState(false) // this visit only

  useEffect(() => {
    // An earlier build let the student hide this card and remembered it here.
    try { localStorage.removeItem(`psyready-hidden:${slug}`) } catch { /* nothing stored */ }
    let live = true
    api(`/user/assessment/${slug}`, { auth: 'user' })
      .then((d) => {
        if (!live) return
        setAssess(d)
        // The test site says the test is not finished after all: re-read the
        // course so the gate comes back in place of this card.
        if (required && (d?.status === 'in_progress' || d?.status === 'not_started')) onReopened?.()
      })
      .catch(() => { if (live) setAssess(null) })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  if (hidden || !assess) return null
  const ready = assess.status === 'completed'
  if (required && !ready) return null

  return (
    <div className="learn-psyready" role="note">
      <div className="learn-psyready-text">
        <p className="learn-psyready-title">
          {ready ? 'Your psychometric report is ready' : 'Your psychometric test'}
        </p>
        <p className="learn-psyready-sub">
          {ready
            ? 'Your report and your best-fit careers are on the test site. Read the weekly videos against it. Tap below, and you are signed in automatically.'
            : 'Your plan includes the psychometric test. Take it whenever suits you — your weeks carry on as normal alongside it.'}
        </p>
      </div>
      <div className="learn-psyready-acts">
        <PsychometricActions product={slug} assessment={assess} onChange={setAssess} />
        <button type="button" className="learn-psyready-hide" onClick={() => setHidden(true)}>Hide</button>
      </div>
    </div>
  )
}
