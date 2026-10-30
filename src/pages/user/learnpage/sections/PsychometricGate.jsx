import { useEffect, useState } from 'react'
import { api } from '../../../../api/client.js'
import PsychometricActions from '../../../../common_component/user/PsychometricTest/PsychometricActions.jsx'

/**
 * What a student sees when their plan bundles the psychometric test and they
 * have not taken it yet: the weeks are shut until it is done.
 *
 * It appears ONLY while it is blocking. Everyone else — a plan without the
 * test, or a student who has already taken it — never sees this, which is why
 * the course page carries no psychometric panel of its own any more.
 *
 * The block is enforced on the server (learn.service.js); this is the part that
 * tells them what to do about it, because a locked course with no explanation
 * is just a bug as far as the student is concerned. The steps, coupon code and
 * buttons themselves are PsychometricActions, shared with the psychometric page
 * and the dashboard.
 */
export default function PsychometricGate({ slug, status, onDone }) {
  const [assess, setAssess] = useState(null)

  // Reading the status is also what asks the test site whether the student has
  // finished (API mode). If it says they have, the gate is already lifted on
  // the server — re-read the course so the weeks open on this visit, without
  // making them tap "I've finished it" for a test the site knows is done.
  useEffect(() => {
    let live = true
    api(`/user/assessment/${slug}`, { auth: 'user' })
      .then((d) => {
        if (!live) return
        setAssess(d)
        if (d?.status === 'completed' || d?.status === 'submitted') onDone?.()
      })
      .catch(() => { if (live) setAssess(null) })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  // The freshest status we hold. The prop comes from the course payload, which
  // is only re-read when the gate lifts — so on its own it still says
  // "not_started" right after the student has opened the test, and the way to
  // say they have finished never appears.
  const current = assess ? assess : { status }

  return (
    <div className="learn-psygate" role="note">
      <p className="learn-psygate-title">Your psychometric test comes first</p>
      <p className="learn-psygate-sub">
        Your plan includes the psychometric test, and the whole course is built to be read against
        your report. Take the test first — the introduction and the weekly videos open as soon as it
        is complete.
      </p>

      <PsychometricActions
        product={slug}
        assessment={current}
        onChange={setAssess}
        onFinished={onDone}   // re-reads the course; the weeks open on this same visit
      />
    </div>
  )
}
