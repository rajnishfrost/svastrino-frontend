import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import OrgSidebar from '../OrgSidebar/OrgSidebar.jsx'
import { OrgProvider, useOrg } from '../OrgContext/OrgContext.jsx'
// Same shell as the admin panel — sidebar + top bar + content slot.
import '../../admin/AdminLayout/AdminLayout.css'

/**
 * Shell + guard for the organisation portal.
 *
 * The guard IS the data load: /org/me only answers for an account that owns an
 * approved, active organisation, so a failure means "not an organisation" and we
 * bounce to the site rather than showing an empty portal.
 */
function Shell({ children }) {
  const [navOpen, setNavOpen] = useState(false)
  const { state, organisation } = useOrg()

  if (state === 'loading') {
    return <div style={{ padding: 40, fontSize: 15, color: '#5b6677' }}>Loading…</div>
  }
  if (state === 'denied') return <Navigate to="/" replace />

  return (
    <div className="admin-shell">
      <OrgSidebar open={navOpen} onClose={() => setNavOpen(false)} />

      {navOpen && <div className="admin-backdrop" onClick={() => setNavOpen(false)} />}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-btn"
            aria-label="Toggle navigation"
            onClick={() => setNavOpen((v) => !v)}
          >
            ☰
          </button>
          <span className="admin-topbar-title">{organisation?.name || 'Organisation'}</span>
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
