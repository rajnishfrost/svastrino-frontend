import { useEffect, useState } from 'react'
import { api } from '../../../../api/client.js'

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
 * is just a bug as far as the student is concerned.
 */
export default function PsychometricGate({ slug, status, onDone }) {
  const [assess, setAssess] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let live = true
    api(`/user/assessment/${slug}`, { auth: 'user' })
      .then((d) => { if (live) setAssess(d) })
      .catch(() => { if (live) setAssess(null) })
    return () => { live = false }
  }, [slug])

  const openTest = async () => {
    setErr(''); setBusy(true)
    try {
      const a = await api(`/user/assessment/${slug}/start`, { method: 'POST', auth: 'user' })
      setAssess(a)
      if (a.testUrl) window.open(a.testUrl, '_blank', 'noopener')
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  const markDone = async () => {
    setErr(''); setBusy(true)
    try {
      await api(`/user/assessment/${slug}/submitted`, { method: 'POST', auth: 'user' })
      await onDone()   // re-reads the course; the weeks open on this same visit
    } catch (e) { setErr(e.message); setBusy(false) }
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(assess.accessCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard blocked — the code is on screen to copy by hand */ }
  }

  // The freshest status we hold. The prop comes from the course payload, which
  // is only re-read when the gate lifts — so on its own it still says
  // "not_started" right after the student has opened the test, and the way to
  // say they have finished never appears.
  const current = assess?.status || status

  return (
    <div className="learn-psygate" role="note">
      <p className="learn-psygate-title">Your psychometric test comes first</p>
      <p className="learn-psygate-sub">
        Your plan includes the psychometric test, and the weekly videos and tasks are built to be
        read against your report. Take the test, then everything opens — the introduction below is
        already open, and it explains how to read what comes back.
      </p>

      {assess?.steps?.length > 0 && (
        <ol className="learn-psygate-steps">
          {assess.steps.map((step, i) => <li key={i}>{step}</li>)}
        </ol>
      )}

      {assess?.accessCode && (
        <p className="learn-psygate-code">
          Your coupon code: <strong>{assess.accessCode}</strong>
          <button type="button" className="learn-psygate-copy" onClick={copyCode}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </p>
      )}

      {err && <p className="learn-err">{err}</p>}

      <div className="learn-psygate-actions">
        <button type="button" className="btn btn-primary" onClick={openTest} disabled={busy}>
          {current === 'not_started' ? 'Take the test' : 'Reopen the test'}
        </button>
        {current !== 'not_started' && (
          <button type="button" className="settings-link" onClick={markDone} disabled={busy}>
            {busy ? 'Checking…' : "I've finished it"}
          </button>
        )}
      </div>
    </div>
  )
}
