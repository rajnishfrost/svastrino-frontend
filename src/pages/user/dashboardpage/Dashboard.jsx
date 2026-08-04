import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../../api/client.js'
import { fetchMyMentoring } from '../../../api/mentoring.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import './Dashboard.css'

/**
 * User dashboard — stacked sections, each with a heading then its card(s):
 *   Mentoring    → per-program session tables (GET /user/mentoring/my)
 *   Skill Build  → the user's real enrollments (GET /user/payments/enrollments)
 */
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null

const fmtWhen = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        weekday: 'short', day: '2-digit', month: 'short',
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
      })
    : null

// Reschedule closes 2 days before the session starts.
const canReschedule = (s) =>
  s.status === 'booked' && s.startAt && new Date(s.startAt).getTime() - Date.now() >= 2 * 24 * 3600_000

// Per-product theme class (scopes the Nirmaan green/brown palette to that card).
const THEME_CLASS = { nirmaan: 'theme-nirmaan' }

export default function Dashboard() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState(null)
  const [mentoring, setMentoring] = useState(null)

  useEffect(() => {
    api('/user/payments/enrollments', { auth: 'user' })
      .then((d) => setEnrollments(d.enrollments || []))
      .catch(() => setEnrollments([]))
    fetchMyMentoring().then(setMentoring).catch(() => setMentoring([]))
  }, [])

  return (
    <section className="section">
      <div className="container">
        <div className="dash-head">
          <h1>Your dashboard</h1>
          <p>Welcome back{user?.name ? `, ${user.name}` : ''}.</p>
        </div>

        {/* ---- Mentoring ---- */}
        <section className="dash-section">
          <h2 className="dash-section-title">Mentoring</h2>

          {mentoring == null ? (
            <div className="card dash-card"><p className="dash-empty">Loading…</p></div>
          ) : mentoring.length === 0 ? (
            <div className="card dash-card">
              <p className="dash-empty">You haven't booked a mentoring program yet.</p>
              <div className="dash-card-foot">
                <Link to="/book-online" className="dash-action">Book a session →</Link>
              </div>
            </div>
          ) : (
            mentoring.map((p) => (
              <div key={p.sku} className="card dash-card">
                <div className="dash-item">
                  <div className="dash-item-main">
                    <h3 className="dash-item-title">{p.name}</h3>
                    <p className="dash-item-meta">
                      {p.sessionsBooked} of {p.sessionsTotal} sessions booked
                      {p.sessionsRemaining > 0 ? ` · ${p.sessionsRemaining} remaining` : ''}
                    </p>
                  </div>
                  <span className="dash-badge dash-badge--active">Active</span>
                </div>

                <div className="dash-table-wrap">
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Session</th>
                        <th>Appointment</th>
                        <th>Session update</th>
                        <th>Tasks</th>
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {p.sessions.map((s) => (
                        <tr key={s.sessionNumber}>
                          <td>#{s.sessionNumber}</td>
                          <td>
                            {s.startAt
                              ? <>{fmtWhen(s.startAt)}{s.status === 'completed' && <span className="dash-done-tag"> · done ✓</span>}</>
                              : <span className="dash-empty">Not booked yet</span>}
                          </td>
                          <td>{s.update || <span className="dash-empty">—</span>}</td>
                          <td>
                            {s.tasks && s.tasks.length > 0
                              ? <ul className="dash-tasks">{s.tasks.map((t, i) => <li key={i}>{t}</li>)}</ul>
                              : <span className="dash-empty">—</span>}
                          </td>
                          <td className="dash-table-action">
                            {!s.startAt && s.sessionNumber === p.sessionsBooked + 1 && (
                              <Link to={`/book-online?program=${p.sku}`} className="dash-action">Book →</Link>
                            )}
                            {canReschedule(s) && (
                              <Link to={`/book-online?program=${p.sku}&reschedule=${s.bookingId}`} className="dash-action">
                                Reschedule
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {p.sessionsRemaining > 0 && (
                  <div className="dash-card-foot">
                    <Link to={`/book-online?program=${p.sku}`} className="dash-action">
                      Book session {p.sessionsBooked + 1} →
                    </Link>
                  </div>
                )}
              </div>
            ))
          )}
        </section>

        {/* ---- Skill Build ---- */}
        <section className="dash-section">
          <h2 className="dash-section-title">Skill Build</h2>

          {enrollments == null ? (
            <div className="card dash-card"><p className="dash-empty">Loading…</p></div>
          ) : enrollments.length === 0 ? (
            <div className="card dash-card">
              <p className="dash-empty">You haven't enrolled in a Skill Build course yet.</p>
              <div className="dash-card-foot">
                <Link to="/skill-build/nirmaan" className="dash-action">Explore Nirmaan →</Link>
              </div>
            </div>
          ) : (
            enrollments.map((e) => (
              <div key={e.id} className={`card dash-card ${THEME_CLASS[e.courseSlug] || ''}`}>
                <div className="dash-item">
                  <div className="dash-item-main">
                    <h3 className="dash-item-title">Nirmaan — {e.packageName}</h3>
                    <p className="dash-item-meta">
                      {e.progress && e.progress.total > 0
                        ? `${e.progress.completed} of ${e.progress.total} sessions complete`
                        : 'Skill Build subscription'}
                      {e.expiresAt ? ` · valid till ${fmtDate(e.expiresAt)}` : ''}
                    </p>
                    {e.progress && e.progress.total > 0 && (
                      <div className="dash-progress"><span style={{ width: `${e.progress.percent}%` }} /></div>
                    )}
                  </div>
                  <span className="dash-badge dash-badge--active">Active</span>
                </div>
                <div className="dash-card-foot">
                  {/* With course content → learn player; otherwise (e.g. a Model
                      Session / no-content tier) send them to the packages page. */}
                  {e.progress && e.progress.total > 0 ? (
                    <Link to={`/learn/${e.courseSlug || 'nirmaan'}`} className="dash-action">
                      {e.progress.completed > 0 ? 'Continue learning →' : 'Start learning →'}
                    </Link>
                  ) : (
                    <Link to={`/skill-build/${e.courseSlug || 'nirmaan'}#packages`} className="dash-action">
                      View packages →
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </section>
  )
}
