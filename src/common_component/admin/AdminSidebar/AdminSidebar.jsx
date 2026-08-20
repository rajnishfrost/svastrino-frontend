import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { api } from '../../../api/client.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import './AdminSidebar.css'

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
  // Assessments — clipboard with a tick (psychometric report)
  assessments: <Svg><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="m9 14 2 2 4-4" /></Svg>,
  // Blog — pen writing on a page (articles)
  blogs: <Svg><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></Svg>,
  // Career Library — open book (course reference pages)
  careerLibrary: <Svg><path d="M2 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H2Z" /><path d="M22 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H22Z" /></Svg>,
  // Content — video (course lessons)
  content: <Svg><path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" /></Svg>,
  // Coupons — ticket
  coupons: <Svg><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2M13 11v2M13 17v2" /></Svg>,
  // Mentoring — calendar (session bookings)
  mentoring: <Svg><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="m9 16 2 2 4-4" /></Svg>,
  // Orders — shopping bag
  orders: <Svg><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></Svg>,
  // Roles — shield with a tick (access control)
  roles: <Svg><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" /><path d="m9 12 2 2 4-4" /></Svg>,
  // Scholarship — graduation cap + award ribbon
  scholarship: <Svg><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v4c0 1.5 2.7 3 6 3s6-1.5 6-3v-4" /><circle cx="20" cy="17" r="2.4" /></Svg>,
  // Skill Builds — graduation cap (courses)
  skillbuilds: <Svg><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c3 2.5 9 2.5 12 0v-5" /><path d="M22 10v6" /></Svg>,
  // Users — people
  users: <Svg><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Svg>,
}

/**
 * Admin navigation — Dashboard first, everything else A→Z. Items are filtered
 * by the signed-in admin's module permissions (superadmin sees all; the server
 * enforces the same permissions on every API route regardless).
 */
const NAV = [
  { label: 'Dashboard', to: '/admin', end: true, icon: 'dashboard' }, // always visible
  // ---- A → Z ----
  { label: 'Assessments', to: '/admin/assessments', icon: 'assessments', module: 'assessments' },
  { label: 'Blog', to: '/admin/blogs', icon: 'blogs', module: 'blogs' },
  { label: 'Career Library', to: '/admin/career-library', icon: 'careerLibrary', module: 'career-library' },
  { label: 'Content', to: '/admin/content', icon: 'content', module: 'content' },
  { label: 'Coupons', to: '/admin/coupons', icon: 'coupons', module: 'coupons' },
  { label: 'Orders', to: '/admin/orders', icon: 'orders', module: 'orders' },
  { label: 'Roles', to: '/admin/roles', icon: 'roles', superadmin: true },
  { label: 'Scholarship', to: '/admin/scholarship', icon: 'scholarship', module: 'scholarship' },
  { label: 'Services', to: '/admin/mentoring', icon: 'mentoring', module: 'mentoring' },
  { label: 'Skill Builds', to: '/admin/skill-builds', icon: 'skillbuilds', module: 'skill-builds' },
  { label: 'Users', to: '/admin/users', icon: 'users', module: 'users' },
]

export default function AdminSidebar({ open, onClose }) {
  const navigate = useNavigate()
  const { logout: authLogout } = useAuth()
  const [me, setMe] = useState(null) // { role, permissions } — null while loading

  useEffect(() => {
    api('/admin/auth/me', { auth: 'admin' })
      .then((d) => setMe(d.admin))
      .catch(() => setMe({ role: 'admin', permissions: [] }))
  }, [])

  const canSee = (item) => {
    if (!item.module && !item.superadmin) return true // Dashboard
    if (me == null) return false // hide gated items until permissions load
    if (me.role === 'superadmin') return true
    if (item.superadmin) return false
    return (me.permissions || []).includes(item.module)
  }

  // One shared session, so signing out of the panel signs out the whole account
  // — clear the token AND the cached profile / auth state (not just the token,
  // or the public site would still show you logged in).
  const logout = () => {
    authLogout()
    navigate('/login', { replace: true })
  }

  // "Superadmin" / "Admin" / a custom role label — prefer the server-provided
  // label, else title-case the role key.
  const titleCase = (s) => String(s || '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const roleLabel = me?.roleLabel || (me?.role === 'superadmin' ? 'Superadmin' : titleCase(me?.role) || 'Admin')
  const initial = (me?.name || 'A').trim().charAt(0).toUpperCase()

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

      {me && (
        <div className="admin-sidebar-user">
          <span className="admin-user-avatar">{initial}</span>
          <div className="admin-user-meta">
            <strong title={me.name}>{me.name}</strong>
            <span className={`admin-user-role${me.role === 'superadmin' ? ' is-super' : ''}`}>{roleLabel}</span>
          </div>
        </div>
      )}

      <button className="admin-logout" onClick={logout}>
        Sign out
      </button>
    </aside>
  )
}
