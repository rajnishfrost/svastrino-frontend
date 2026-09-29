import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'
import { homeFor } from '../../../utils/portalAccess.js'

/**
 * Guards guest-only pages (e.g. /login). A signed-in user has no business on the
 * login/signup screen, so send them to where they were headed, or the dashboard —
 * or, for an admin or an institution's owner, their own panel.
 * Inverse of ProtectedRoute.
 */
export default function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="container" style={{ padding: '80px 0' }}>Loading…</div>
  }

  if (user) {
    return <Navigate to={homeFor(user) || location.state?.from || '/dashboard'} replace />
  }

  return children
}
