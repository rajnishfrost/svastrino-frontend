import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../../api/client.js'
import { fetchMyMentoring } from '../../../api/mentoring.js'
import { useAuth } from '../../../context/AuthContext.jsx'

/**
 * User dashboard — stacked sections, each with a heading then its card(s):
 *   Mentoring    → per-program session tables (GET /user/mentoring/my)
 *   Skill Build  → the user's real enrollments (GET /user/payments/enrollments)
 */
// Course dates are read in IST here, as they are on the course pages.
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
      })
    : null

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

/**
 * Where this enrolment stands against the one-year rule (decided by the server).
 * 'active' is the fallback for a payload without it.
 */
const accessState = (e) => e.access?.state || 'active'

const CARD = 'rounded-xl border border-brand-navy/5 bg-white p-6 shadow-sm'
const ACTION = 'inline-flex items-center gap-1 text-sm font-semibold text-brand-crimson hover:underline'

export default function Dashboard() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState(null)

  // Buying a mentoring program creates an enrollment too; mentoring has its
  // own section above (fed by the bookings API), so it is filtered out here.
  const courses = enrollments == null ? null : enrollments.filter((e) => e.kind !== 'mentoring')
  const [mentoring, setMentoring] = useState(null)

  useEffect(() => {
    api('/user/payments/enrollments', { auth: 'user' })
      .then((d) => setEnrollments(d.enrollments || []))
      .catch(() => setEnrollments([]))
    fetchMyMentoring().then(setMentoring).catch(() => setMentoring([]))
  }, [])

  return (
    <section className="bg-white py-12 md:py-16">
      <div className="container">
        <div className="border-b border-brand-navy/10 pb-6">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-navy">Your dashboard</h1>
          <p className="mt-2 text-brand-slate">Welcome back{user?.name ? `, ${user.name}` : ''}.</p>
        </div>

        {/* ---- Mentoring ---- */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-brand-navy">Mentoring</h2>

          <div className="mt-4 space-y-5">
            {mentoring == null ? (
              <div className={CARD}><p className="text-brand-slate">Loading…</p></div>
            ) : mentoring.length === 0 ? (
              <div className={CARD}>
                <p className="text-brand-slate">You haven't booked a mentoring program yet.</p>
                <div className="mt-4">
                  <Link to="/book-online" className={ACTION}>Book a session →</Link>
                </div>
              </div>
            ) : (
              mentoring.map((p) => (
                <div key={p.sku} className={CARD}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-bold text-brand-navy">{p.name}</h3>
                      <p className="mt-0.5 text-sm text-brand-slate">
                        {p.sessionsBooked} of {p.sessionsTotal} sessions booked
                        {p.sessionsRemaining > 0 ? ` · ${p.sessionsRemaining} remaining` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">Active</span>
                  </div>

                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-brand-navy/10 text-left text-xs uppercase tracking-wide text-brand-slate">
                          <th className="py-2 pr-4 font-semibold">Session</th>
                          <th className="py-2 pr-4 font-semibold">Appointment</th>
                          <th className="py-2 pr-4 font-semibold">Session update</th>
                          <th className="py-2 pr-4 font-semibold">Tasks</th>
                          <th aria-label="Actions" />
                        </tr>
                      </thead>
                      <tbody>
                        {p.sessions.map((s) => (
                          <tr key={s.sessionNumber} className="border-b border-brand-navy/5 align-top text-brand-navy">
                            <td className="py-3 pr-4 font-semibold">#{s.sessionNumber}</td>
                            <td className="py-3 pr-4">
                              {s.startAt
                                ? <>{fmtWhen(s.startAt)}{s.status === 'completed' && <span className="text-green-600"> · done ✓</span>}</>
                                : <span className="text-brand-slate">Not booked yet</span>}
                            </td>
                            <td className="py-3 pr-4">{s.update || <span className="text-brand-slate">—</span>}</td>
                            <td className="py-3 pr-4">
                              {s.tasks && s.tasks.length > 0
                                ? <ul className="list-disc space-y-1 pl-4">{s.tasks.map((t, i) => <li key={i}>{t}</li>)}</ul>
                                : <span className="text-brand-slate">—</span>}
                            </td>
                            <td className="py-3 text-right">
                              {!s.startAt && s.sessionNumber === p.sessionsBooked + 1 && (
                                <Link to={`/book-online?program=${p.sku}`} className={ACTION}>Book →</Link>
                              )}
                              {canReschedule(s) && (
                                <Link to={`/book-online?program=${p.sku}&reschedule=${s.bookingId}`} className={ACTION}>
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
                    <div className="mt-4">
                      <Link to={`/book-online?program=${p.sku}`} className={ACTION}>
                        Book session {p.sessionsBooked + 1} →
                      </Link>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* ---- Skill Build ---- */}
        <section className="mt-12">
          <h2 className="font-display text-xl font-bold text-brand-navy">Skill Build</h2>

          <div className="mt-4 space-y-5">
            {courses == null ? (
              <div className={CARD}><p className="text-brand-slate">Loading…</p></div>
            ) : courses.length === 0 ? (
              <div className={CARD}>
                <p className="text-brand-slate">You haven't enrolled in a Skill Build course yet.</p>
                <div className="mt-4">
                  <Link to="/skill-build/nirmaan" className={ACTION}>Explore Nirmaan →</Link>
                </div>
              </div>
            ) : (
              courses.map((e) => {
                const state = accessState(e)
                const open = state === 'active'
                const isNirmaan = (e.courseSlug || 'nirmaan') === 'nirmaan'
                const accent = isNirmaan ? 'text-nirmaan-green' : 'text-brand-crimson'
                const bar = isNirmaan ? 'bg-nirmaan-green' : 'bg-brand-crimson'
                return (
                  <div key={e.id} className={CARD}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-lg font-bold text-brand-navy">
                          {e.courseName ? `${e.courseName} — ${e.packageName}` : e.packageName}
                        </h3>
                        <p className="mt-0.5 text-sm text-brand-slate">
                          {e.progress && e.progress.total > 0
                            ? `${e.progress.completed} of ${e.progress.total} sessions complete`
                            : 'Skill Build subscription'}
                          {e.expiresAt
                            ? open
                              ? ` · valid till ${fmtDate(e.expiresAt)}`
                              : ` · ended on ${fmtDate(e.expiresAt)}`
                            : ''}
                        </p>
                        {e.progress && e.progress.total > 0 && (
                          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-brand-navy/10">
                            <span className={`block h-full rounded-full ${bar}`} style={{ width: `${e.progress.percent}%` }} />
                          </div>
                        )}
                      </div>
                      {open ? (
                        <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">Active</span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-brand-navy/10 px-2.5 py-0.5 text-xs font-semibold text-brand-slate">Course closed</span>
                      )}
                    </div>
                    <div className="mt-4">
                      {e.progress && e.progress.total > 0 ? (
                        <Link to={`/learn/${e.courseSlug || 'nirmaan'}`} className={`inline-flex items-center gap-1 text-sm font-semibold hover:underline ${accent}`}>
                          {open
                            ? e.progress.completed > 0 ? 'Continue learning →' : 'Start learning →'
                            : state === 'expired' ? 'Download your work →' : 'View course details →'}
                        </Link>
                      ) : (
                        <Link to={`/skill-build/${e.courseSlug || 'nirmaan'}#packages`} className={`inline-flex items-center gap-1 text-sm font-semibold hover:underline ${accent}`}>
                          View packages →
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>
    </section>
  )
}
