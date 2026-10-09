import { useEffect, useState } from 'react'
import { api } from '../../../api/client.js'
import '../../admin/adminShared.css'
import { SkeletonTable } from '../../../common_component/Skeleton/Skeleton.jsx'

/**
 * Student Reports — the institute's own admin on the assessment site
 * (assessment.svastrino.com/admin), inside this panel.
 *
 * Signing in: Mindler keeps the admin session in its own site's storage, which
 * our pages cannot write (different origin), and it has no token login for
 * admins. So the institute signs in once inside the frame; the email to use is
 * shown above it, with a copy button, and Mindler keeps the session afterwards.
 */
export default function OrgReports() {
  const [m, setM] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  // The assessment site takes a few seconds to load in the frame; a loader
  // covers it until it has, so the page never sits there looking blank.
  const [frameReady, setFrameReady] = useState(false)

  useEffect(() => {
    api('/org/reports', { auth: 'user' }).then((d) => setM(d.mindler)).catch((e) => setError(e.message))
  }, [])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(m.loginId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('Could not copy — please select the email and copy it by hand.')
    }
  }

  return (
    <div>
      <h1 className="adm-title">Student Reports</h1>
      {error && <p className="adm-error">{error}</p>}

      {!m ? (!error && <SkeletonTable rows={6} cols={4} />) : !m.connected ? (
        <p className="adm-sub">
          Your account on the assessment site is not set up yet. The Svastrino team will let you know once it is.
        </p>
      ) : (
        <>
          <div className="adm-toolbar adm-mindler-bar">
            <div className="adm-sub" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>Sign in below with</span>
              <strong>{m.loginId}</strong>
              <button className="adm-btn adm-btn--sm adm-btn--ghost" onClick={copyEmail}>
                {copied ? 'Copied ✓' : 'Copy email'}
              </button>
              <span>— the session is kept for later visits.</span>
            </div>
            <a className="adm-link" href={m.adminUrl} target="_blank" rel="noopener noreferrer">
              Open in a new tab ↗
            </a>
          </div>
          <div className="org-reports-wrap">
            <iframe title="Student reports" src={m.adminUrl} className="adm-mindler-frame org-reports-frame"
                    onLoad={() => setFrameReady(true)} />
            {!frameReady && (
              <div className="org-reports-load" role="status" aria-live="polite">
                <div className="org-reports-spinner" aria-hidden />
                <p className="org-reports-load-title">Opening your student reports</p>
                <p className="org-reports-load-sub">This takes a few seconds — please keep this page open.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
