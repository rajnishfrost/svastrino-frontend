import { useState } from 'react'
import AdminSidebar from '../AdminSidebar/AdminSidebar.jsx'
import './AdminLayout.css'

/** Shell for every admin page: sidebar + top bar + content slot. */
export default function AdminLayout({ children }) {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="admin-shell">
      <AdminSidebar open={navOpen} onClose={() => setNavOpen(false)} />

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
          <span className="admin-topbar-title">Admin Panel</span>
          <a href="/" className="admin-topbar-link" target="_blank" rel="noreferrer">
            View site ↗
          </a>
        </header>

        <div className="admin-content">{children}</div>
      </div>
    </div>
  )
}
