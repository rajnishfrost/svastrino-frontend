import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'
import './Navbar.css'

/**
 * Top navigation — mirrors the agreed Svastrino rebuild structure:
 *   Home · Mentoring ▾ · Book Online · Courses · Resources ▾ · Blog · Contact · Login
 * Mentoring & Resources have dropdowns; Courses is a direct link (no dropdown).
 * Fully responsive: collapses to a hamburger drawer on tablet/mobile.
 */
const MENTORING_LINKS = [
  { label: "Bull's Eye Program", to: '/mentoring#bulls-eye' },
  { label: 'Bloom Program', to: '/mentoring#bloom' },
  { label: 'Breakthrough Program', to: '/mentoring#breakthrough' },
]

const RESOURCES_LINKS = [
  { label: 'Career Library', to: '/resources#career-library' },
  { label: "FAQ's", to: '/resources#faqs' },
  { label: 'Success Stories', to: '/resources#success-stories' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const { pathname } = useLocation()
  const isNirmaan = pathname.startsWith('/skill-build/nirmaan')
  const close = () => setOpen(false)

  return (
    <nav className="nav">
      <div className="nav-inner container">
        {/* Brand is always Svastrino — even on the Nirmaan page — so users can
            always return home. The logo is the full wordmark (name baked in). */}
        <Link className="nav-brand" to="/" onClick={close}>
          <img src="/logo.png" alt="Svastrino Consultancy Services" />
        </Link>

        <button
          className="nav-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-links${open ? ' is-open' : ''}`}>
          {/* On Svastrino: "Skill Build" green pill with hover dropdown (Nirmaan inside).
              On the Nirmaan page: plain "Home" link back to the Svastrino homepage. */}
          {isNirmaan ? (
            <Link to="/" onClick={close} className="nav-item">
              Home
            </Link>
          ) : (
            <SkillBuildDropdown onNavigate={close} />
          )}

          <Dropdown label="Mentoring" to="/mentoring" items={MENTORING_LINKS} onNavigate={close} />

          <NavLink to="/book-online" onClick={close} className={navClass}>
            Book Online
          </NavLink>

          <Dropdown label="Resources" to="/resources" items={RESOURCES_LINKS} onNavigate={close} />

          <NavLink to="/blog" onClick={close} className={navClass}>
            Blog
          </NavLink>

          <NavLink to="/contact" onClick={close} className={navClass}>
            Contact
          </NavLink>

          {user ? (
            <ProfileMenu user={user} onNavigate={close} />
          ) : (
            <Link to="/login" className="btn btn-primary" onClick={close}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

const navClass = ({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')

/** Green pill with a hover dropdown. Currently exposes only "Nirmaan" inside;
 *  add more items to the array as new skill-build courses launch. */
function SkillBuildDropdown({ onNavigate }) {
  const [open, setOpen] = useState(false)
  const items = [{ label: 'Nirmaan', to: '/skill-build/nirmaan' }]

  return (
    <div
      className={`nav-dropdown nav-skill-build${open ? ' is-open' : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="nav-courses-btn"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        Skill Build
      </button>

      <div className="nav-dropdown-menu nav-dropdown-menu--skill-build" role="menu">
        {items.map((item) => (
          <Link key={item.to} to={item.to} onClick={onNavigate}>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

/** A hover/click dropdown that is still tappable on mobile (renders inline). */
function Dropdown({ label, to, items, onNavigate }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={`nav-dropdown${open ? ' is-open' : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="nav-item nav-dropdown-trigger"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <span className="nav-caret" aria-hidden>▾</span>
      </button>

      <div className="nav-dropdown-menu">
        <Link to={to} className="nav-dropdown-head" onClick={onNavigate}>
          All {label}
        </Link>
        {items.map((item) => (
          <Link key={item.to} to={item.to} onClick={onNavigate}>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

/**
 * Signed-in account menu. Shows the user's avatar (Google photo, else initials)
 * and a dropdown with Dashboard · Settings · Sign out. Click-to-open on desktop
 * (closes on outside click); on mobile it renders inline inside the drawer.
 */
function ProfileMenu({ user, onNavigate }) {
  const [open, setOpen] = useState(false)
  const [avatarOk, setAvatarOk] = useState(true) // falls back to initials if the photo fails to load
  const { logout } = useAuth()
  const navigate = useNavigate()
  const ref = useRef(null)

  // Close the desktop dropdown when clicking anywhere outside it.
  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const closeAll = () => {
    setOpen(false)
    onNavigate?.()
  }

  const handleSignOut = () => {
    closeAll()
    logout()
    navigate('/')
  }

  const initial = (user.name || user.email || '?').trim().charAt(0).toUpperCase()

  return (
    <div className={`nav-profile${open ? ' is-open' : ''}`} ref={ref}>
      <button
        type="button"
        className="nav-avatar"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
      >
        {user.avatar && avatarOk ? (
          <img
            src={user.avatar}
            alt=""
            className="nav-avatar-img"
            referrerPolicy="no-referrer"
            onError={() => setAvatarOk(false)}
          />
        ) : (
          <span className="nav-avatar-initial">{initial}</span>
        )}
        <span className="nav-avatar-name">{user.name || 'Account'}</span>
      </button>

      <div className="nav-profile-menu" role="menu">
        <div className="nav-profile-head">
          <span className="nav-profile-name">{user.name || 'Account'}</span>
          {user.email && <span className="nav-profile-email">{user.email}</span>}
        </div>
        {/* Panel accounts can hop to the admin panel from the site. */}
        {user.panel && (
          <Link to="/admin" className="nav-profile-item" role="menuitem" onClick={closeAll}>
            <ShieldIcon /> Admin Panel
          </Link>
        )}
        {/* Same for a partner organisation's owner — only once it's approved
            and active, so the link never lands on a 403. */}
        {user.organisation?.portal && (
          <Link to="/organisation" className="nav-profile-item" role="menuitem" onClick={closeAll}>
            <ShieldIcon /> Organisation Portal
          </Link>
        )}
        <Link to="/dashboard" className="nav-profile-item" role="menuitem" onClick={closeAll}>
          <GridIcon /> Dashboard
        </Link>
        <Link to="/downloads" className="nav-profile-item" role="menuitem" onClick={closeAll}>
          <DownloadIcon /> Downloads
        </Link>
        <Link to="/settings" className="nav-profile-item" role="menuitem" onClick={closeAll}>
          <GearIcon /> Settings
        </Link>
        <button
          type="button"
          className="nav-profile-item nav-profile-signout"
          role="menuitem"
          onClick={handleSignOut}
        >
          <SignOutIcon /> Sign out
        </button>
      </div>
    </div>
  )
}

/* ---------- Menu icons ---------- */
function ShieldIcon() {
  return (
    <svg className="nav-profile-ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg className="nav-profile-ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg className="nav-profile-ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v12" />
      <path d="M7 11l5 5 5-5" />
      <path d="M4 20h16" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg className="nav-profile-ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg className="nav-profile-ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
