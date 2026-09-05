import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'
import { isPanelOnly, NO_PORTAL_MESSAGE } from '../../../utils/portalAccess.js'

/**
 * The gate on the student portal — the dashboard, a course, a checkout.
 *
 * Three answers, and telling them apart matters.
 *
 * Signed out: go and log in, then come straight back to where you were.
 *
 * Signed in, but this account is not for the portal (a panel-only account —
 * see utils/portalAccess): they are NOT sent to the login page. They are
 * already logged in, so that reads as a broken session and they would retype a
 * password that was never the problem. The navbar already hides every portal
 * link from them, so reaching this at all means a bookmark or a pasted URL —
 * one plain sentence and a way onwards is the whole of what is owed.
 *
 * Otherwise: through.
 *
 * The server refuses these routes' data too (requireSiteAccess). This is not
 * the gate; it is what stops a page loading and then failing a request at a time.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="container" style={{ padding: '80px 0' }}>Loading…</div>
  }

  if (!user) {
    // Preserve the full path incl. query (e.g. /checkout?pkg=…) so the user
    // returns exactly where they were after logging in.
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  }

  if (isPanelOnly(user)) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 520, padding: '72px 0' }}>
          <h1 style={{ fontSize: 22, marginBottom: 10 }}>No access with this account</h1>
          <p style={{ marginBottom: 20 }}>{NO_PORTAL_MESSAGE}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Link to="/" className="btn btn-primary">Back to the site</Link>
            {user.panel && <Link to="/admin" className="btn btn-ghost">Admin panel</Link>}
          </div>
        </div>
      </section>
    )
  }

  return children
}
