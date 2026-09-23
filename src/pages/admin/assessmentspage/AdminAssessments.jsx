import '../adminShared.css'

// Mindler's own admin portal. It sends no X-Frame-Options or CSP, so it opens
// inside this page; checked 2026-09-22, including signing in within the frame.
// If they ever start refusing to be framed, the frame goes blank and the "open
// in a new tab" link beside it still works.
const MINDLER_ADMIN_URL = import.meta.env.VITE_MINDLER_ADMIN_URL || 'https://assessment.svastrino.com/admin'

/**
 * Mindler Admin: Mindler's portal, inside ours. Everything about the test lives
 * there — who signed up, who finished, each student's report and matches — so
 * the admin works in it directly rather than copying it across.
 *
 * This page used to be our own list, where an admin attached a student's report
 * so it showed on our site. That was dropped on 2026-09-22: students now read
 * their report on the test site itself (My Report / My Result), reached from our
 * "See your report" button, which signs them in there. The admin API behind the
 * old list (server: /api/admin/assessments) is still in place but unused.
 *
 * The route and the permission key ('assessments') are unchanged, so nobody's
 * access moved when the name did.
 */
export default function AdminAssessments() {
  return (
    <div>
      <h1 className="adm-title">Mindler Admin</h1>
      <div className="adm-toolbar adm-mindler-bar">
        <p className="adm-sub" style={{ margin: 0 }}>
          Sign in with the Mindler admin account the first time — the session is kept for later visits.
        </p>
        <a className="adm-link" href={MINDLER_ADMIN_URL} target="_blank" rel="noopener noreferrer">
          Open in a new tab ↗
        </a>
      </div>
      <iframe title="Mindler admin portal" src={MINDLER_ADMIN_URL} className="adm-mindler-frame" />
    </div>
  )
}
