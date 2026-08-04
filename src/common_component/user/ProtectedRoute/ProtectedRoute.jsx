import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'

/** Guards user-account pages (e.g. /dashboard). Redirects to /login if signed out. */
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

  return children
}
