import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'

/**
 * Restricts a route to specific application roles. Use inside a ProtectedRoute
 * (or on its own — it also handles the logged-out case):
 *   <RoleRoute roles={['institution']}><InstitutionDashboard /></RoleRoute>
 * A logged-out user goes to /login; a wrong-role user goes to /dashboard.
 * (Ready for Phase-3 institution / referral areas.)
 */
export default function RoleRoute({ roles = [], children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="container" style={{ padding: '80px 0' }}>Loading…</div>
  }
  if (!user) return <Navigate to="/login" replace />
  if (roles.length && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />

  return children
}
