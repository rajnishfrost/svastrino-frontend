import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../../api/notifications.js'
import './NotificationBell.css'

// Seconds per unit, for the relative timestamps below.
const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY
const YEAR = 365 * DAY

/**
 * "2 hours ago" for one timestamp. Written out here rather than pulled from a
 * date library, because a single line of text in a single dropdown is not worth
 * shipping a dependency to every visitor for.
 */
function timeAgo(iso) {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ''

  // Clamped at zero so a clock a few seconds behind the server never reads
  // as "in the future".
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (secs < MINUTE) return 'just now'

  const [unit, size] =
    secs < HOUR ? ['minute', MINUTE]
      : secs < DAY ? ['hour', HOUR]
        : secs < WEEK ? ['day', DAY]
          : secs < MONTH ? ['week', WEEK]
            : secs < YEAR ? ['month', MONTH]
              : ['year', YEAR]

  const n = Math.floor(secs / size)
  return `${n} ${unit}${n === 1 ? '' : 's'} ago`
}

/**
 * The bell in the navbar, shown only to a signed-in account. It carries the
 * unread count and opens a short list of what has happened to that student —
 * a report attached, a session confirmed, a payment gone through — plus a way
 * through to the offers page.
 *
 * Nothing here is allowed to be load-bearing: every request fails silently, so
 * a student on a train with no signal still gets a working navbar and a bell
 * that simply shows whatever it last managed to load.
 */
export default function NotificationBell({ onNavigate }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const navigate = useNavigate()
  const ref = useRef(null)
  const btnRef = useRef(null)

  /**
   * One call brings back both the list and the badge. A failure is swallowed
   * on purpose — see the note at the top of the file.
   */
  const load = useCallback(() => {
    fetchNotifications()
      .then((data) => {
        setItems(data?.notifications || [])
        setUnread(data?.unread || 0)
      })
      .catch(() => {
        /* Offline, or the server is unhappy. Keep whatever we already had. */
      })
  }, [])

  // Once on mount to paint the badge, and again whenever the panel opens so an
  // open list is never stale.
  //
  // There is deliberately no interval on top of that. A background poll every
  // few seconds would multiply requests across every signed-in tab, all day,
  // to watch a number that changes a handful of times a week — the cost is real
  // and the benefit is a badge that updates a few seconds sooner.
  useEffect(() => { load() }, [load])
  useEffect(() => { if (open) load() }, [open, load])

  // While the panel is open, a click anywhere else or Escape closes it. Escape
  // hands focus back to the bell, which is where a keyboard user left it.
  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      btnRef.current?.focus()
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const closeAll = () => {
    setOpen(false)
    onNavigate?.()
  }

  /**
   * Opening a notification marks it read and follows its link when it has one.
   * The row is updated locally first: the student has plainly read it, and the
   * badge should not wait on a round trip to agree.
   */
  const openItem = (n) => {
    if (!n.read) {
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      setUnread((count) => Math.max(0, count - 1))
      markNotificationRead(n.id).catch(() => { /* it will be marked next time */ })
    }
    closeAll()
    if (n.link) navigate(n.link)
  }

  const markAll = () => {
    setItems((list) => list.map((x) => ({ ...x, read: true })))
    setUnread(0)
    markAllNotificationsRead().catch(() => { /* the badge is already cleared here */ })
  }

  return (
    <div className={`nav-notif${open ? ' is-open' : ''}`} ref={ref}>
      <button
        type="button"
        ref={btnRef}
        className="nav-notif-btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="nav-notif-panel"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications, none unread'}
        onClick={() => setOpen((v) => !v)}
      >
        <BellIcon />
        <span className="nav-notif-label">Notifications</span>
        {/* The count is already in the button's label, so the badge itself is
            decoration as far as a screen reader is concerned. */}
        {unread > 0 && (
          <span className="nav-notif-badge" aria-hidden>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      <div className="nav-notif-panel" id="nav-notif-panel">
        <div className="nav-notif-head">
          <span className="nav-notif-title">Notifications</span>
          {unread > 0 && (
            <button type="button" className="nav-notif-mark" onClick={markAll}>
              Mark all read
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <p className="nav-notif-empty">
            Nothing here yet. We'll tell you when a report is ready, a session is confirmed
            or a payment goes through.
          </p>
        ) : (
          <ul className="nav-notif-list">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`nav-notif-item${n.read ? '' : ' is-unread'}`}
                  onClick={() => openItem(n)}
                >
                  <span className="nav-notif-item-title">{n.title}</span>
                  {n.body && <span className="nav-notif-item-body">{n.body}</span>}
                  <span className="nav-notif-item-time">{timeAgo(n.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <Link to="/offers" className="nav-notif-foot" onClick={closeAll}>
          See what's on offer
        </Link>
      </div>
    </div>
  )
}

function BellIcon() {
  return (
    <svg className="nav-notif-ico" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8a6 6 0 0 0-12 0c0 6-3 7-3 7h18s-3-1-3-7" />
      <path d="M13.7 20a2 2 0 0 1-3.4 0" />
    </svg>
  )
}
