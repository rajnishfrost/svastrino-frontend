import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'
import { useOrg } from '../OrgContext/OrgContext.jsx'
// Same chrome as the admin panel — one sidebar style for every staff-facing area.
import '../../admin/AdminSidebar/AdminSidebar.css'

// Clean line icons (Feather/Lucide style — 24×24, currentColor stroke).
const Svg = ({ children }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
)
const ICON = {
  // Dashboard — panels grid
  dashboard: <Svg><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></Svg>,
  // Students — people
  students: <Svg><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Svg>,
  // Scholarship — graduation cap + award ribbon
  scholarship: <Svg><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v4c0 1.5 2.7 3 6 3s6-1.5 6-3v-4" /><circle cx="20" cy="17" r="2.4" /></Svg>,
  // Profile — building (the organisation itself)
  profile: <Svg><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01" /></Svg>,
}

/**
 * Organisation portal navigation. Items are filtered by the modules the admin
 * granted THIS organisation (the server enforces the same list on every /api/org
 * route regardless, so hiding a link is convenience, not security).
 */
const NAV = [
  { label: 'Dashboard', to: '/organisation', end: true, icon: 'dashboard' }, // always visible
  { label: 'Students', to: '/organisation/students', icon: 'students', module: 'students' },
  { label: 'Scholarship', to: '/organisation/scholarship', icon: 'scholarship', module: 'scholarship' },
  { label: 'Organisation', to: '/organisation/profile', icon: 'profile', module: 'profile' },
]

export default function OrgSidebar({ open, onClose }) {
  const navigate = useNavigate()
  const { logout: authLogout } = useAuth()
  const { organisation, typeLabel, modules, user } = useOrg()

  const canSee = (item) => !item.module || (modules || []).includes(item.module)

  // One shared session, so signing out here signs out the whole account.
  const logout = () => {
    authLogout()
    navigate('/login', { replace: true })
  }

  const initial = (organisation?.name || 'O').trim().charAt(0).toUpperCase()

  return (
    <aside className={`admin-sidebar${open ? ' is-open' : ''}`}>
      <div className="admin-sidebar-brand">
        {/* White wordmark variant so the navy-text logo reads on the dark sidebar. */}
        <img src="/logo-white.png" alt="Svastrino Consultancy Services" />
      </div>

      <nav className="admin-sidebar-nav">
        {NAV.filter(canSee).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) => (isActive ? 'admin-nav-item active' : 'admin-nav-item')}
          >
            <span className="admin-nav-icon" aria-hidden>{ICON[item.icon]}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {organisation && (
        <div className="admin-sidebar-user">
          <span className="admin-user-avatar">{initial}</span>
          <div className="admin-user-meta">
            <strong title={organisation.name}>{organisation.name}</strong>
            <span className="admin-user-role">{typeLabel || 'Organisation'}</span>
          </div>
        </div>
      )}

      <button className="admin-logout" onClick={logout}>
        Sign out
      </button>
    </aside>
  )
}
