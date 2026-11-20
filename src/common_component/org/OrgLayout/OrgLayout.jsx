import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import OrgSidebar from '../OrgSidebar/OrgSidebar.jsx'
import { OrgProvider, useOrg } from '../OrgContext/OrgContext.jsx'
// Same shell as the admin panel — sidebar + top bar + content slot.
import '../../admin/AdminLayout/AdminLayout.css'
import './OrgLayout.css'
import { SkeletonTable } from '../../Skeleton/Skeleton.jsx'

/**
 * Shell + guard for the organisation portal.
 *
 * The guard IS the data load: /org/me only answers for an account that owns an
 * approved, active organisation, so a failure means "not an organisation" and we
 * bounce to the site rather than showing an empty portal.
 */
// The menu stays where the user left it on every page — no page folds it away
// by itself. Only the ☰ button hides or shows it.
const isPhone = () => window.matchMedia('(max-width: 899px)').matches

function Shell({ children }) {
  const [navOpen, setNavOpen] = useState(false)         // phone: drawer open
  const [collapsed, setCollapsed] = useState(false)     // desktop: menu hidden
  const { state, organisation } = useOrg()

  // One button for both: the drawer on a phone, folding the menu on a desktop.
  const toggleNav = () => (isPhone() ? setNavOpen((v) => !v) : setCollapsed((v) => !v))

  if (state === 'loading') {
    return <div style={{ padding: 40 }}><SkeletonTable rows={6} cols={4} /></div>
  }
  if (state === 'denied') return <Navigate to="/" replace />

  return (
    <div className={`admin-shell org-shell${collapsed ? ' is-collapsed' : ''}`}>
      <OrgSidebar open={navOpen} onClose={() => setNavOpen(false)} />

      {navOpen && <div className="admin-backdrop" onClick={() => setNavOpen(false)} />}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-btn"
            aria-label={collapsed ? 'Show menu' : 'Hide menu'}
            title={collapsed ? 'Show menu' : 'Hide menu'}
            onClick={toggleNav}
          >
            ☰
          </button>
          <span className="admin-topbar-title">{organisation?.name || 'Institute'}</span>
          <a href="/" className="admin-topbar-link" target="_blank" rel="noreferrer">
            View site ↗
          </a>
        </header>

        <div className="admin-content">{children}</div>
      </div>
    </div>
  )
}

export default function OrgLayout({ children }) {
  return (
    <OrgProvider>
      <Shell>{children}</Shell>
    </OrgProvider>
  )
}
