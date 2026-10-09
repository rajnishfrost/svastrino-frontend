import { useEffect, useState } from 'react'
import { api } from '../../../api/client.js'
import '../../admin/adminShared.css'
import { SkeletonTable } from '../../../common_component/Skeleton/Skeleton.jsx'

/**
 * Student Reports — the institution's own admin on the assessment site
 * (assessment.svastrino.com/admin), opened inside this panel the same way our
 * admin's "Mindler Admin" page does. There the institution sees its students,
 * who finished, and every report.
 *
 * Signing in: Mindler keeps the admin's session in its own site's storage and
 * has no token login for admins (only for students), so this page cannot sign
 * the institution in by itself. It signs in once inside the frame with the
 * login shown above it; the session is kept after that. When Mindler adds an
 * admin token login, the server will hand back a signed-in link instead of
 * `adminUrl` and nothing else here changes.
 */
export default function OrgReports() {
  const [m, setM] = useState(null)
  const [error, setError] = useState('')
  // The assessment site takes a few seconds to load in the frame; a loader
  // covers it until it has, so the page never sits there looking blank.
  const [frameReady, setFrameReady] = useState(false)

  useEffect(() => {
    api('/org/reports', { auth: 'user' }).then((d) => setM(d.mindler)).catch((e) => setError(e.message))
  }, [])

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
            <p className="adm-sub" style={{ margin: 0 }}>
              Sign in with <strong>{m.loginId}</strong> the first time — the session is kept for later visits.
            </p>
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
