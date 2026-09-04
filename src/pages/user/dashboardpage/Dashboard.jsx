import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, useParams } from 'react-router-dom'
import { api } from '../../../api/client.js'
import { fetchMyMentoring } from '../../../api/mentoring.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import Downloads from '../downloadspage/Downloads.jsx'
import Settings from '../settingspage/Settings.jsx'

/**
 * The student's dashboard: a sidebar on the left, one panel at a time.
 *   /dashboard/services     → mentoring programs booked (the "Services" tab)
 *   /dashboard/skill-build  → courses, each with a bar and a button to carry on
 *   /dashboard/downloads    → videos saved for offline (the Downloads page, embedded)
 *   /dashboard/settings     → account + orders (the Settings page, embedded; its
 *                             own ?section=orders&order=ID keeps working inside)
 * The tab lives in the URL, so a refresh, a shared link and the profile menu
 * all land on the same view. Bare /dashboard goes to Skill Build - the course
 * is what a signed-in student is here for most days.
 *
 * "Continue learning" and the mentoring pages are NOT folded in here: the
 * course player and the booking flow keep their own full-width pages.
 */
const TABS = [
  { key: 'services', label: 'Services', icon: 'services' },
  { key: 'skill-build', label: 'Skill-Build', icon: 'skillbuild' },
  { key: 'downloads', label: 'Downloads', icon: 'downloads' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
]
const DEFAULT_TAB = 'skill-build'

// Clean line icons (Feather/Lucide style - 24×24, currentColor stroke).
const Svg = ({ children }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
)
const ICON = {
  // Services - people (a mentor and a student)
  services: <Svg><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Svg>,
  // Skill Build - an open book
  skillbuild: <Svg><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></Svg>,
  // Downloads - arrow into a tray
  downloads: <Svg><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></Svg>,
  // Settings - gear
  settings: <Svg><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></Svg>,
}

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
const PANEL_TITLE = 'font-display text-xl font-bold text-brand-navy'

/**
 * The course name in front of the plan reads "Nirmaan — Nirmaan" whenever the
 * plan is simply the course, so a plan that already opens with the course name
 * is shown on its own.
 */
const courseTitle = (courseName, packageName) =>
  courseName && packageName && !packageName.startsWith(courseName)
    ? `${courseName} — ${packageName}`
    : packageName || courseName

export default function Dashboard() {
  const { user } = useAuth()
  const { tab } = useParams()
  const [enrollments, setEnrollments] = useState(null)
  const [mentoring, setMentoring] = useState(null)

  // Buying a mentoring program creates an enrollment too; mentoring has its
  // own panel (fed by the bookings API), so it is filtered out of the courses.
  const courses = enrollments == null ? null : enrollments.filter((e) => e.kind !== 'mentoring')

  useEffect(() => {
    api('/user/payments/enrollments', { auth: 'user' })
      .then((d) => setEnrollments(d.enrollments || []))
      .catch(() => setEnrollments([]))
    fetchMyMentoring().then(setMentoring).catch(() => setMentoring([]))
  }, [])

  // No tab, or one that is not on the sidebar: go to the default. A redirect
  // rather than a silent fallback, so the address bar always says where you are.
  if (!TABS.some((t) => t.key === tab)) return <Navigate to={`/dashboard/${DEFAULT_TAB}`} replace />

  return (
    <section className="bg-white py-10 md:py-14">
      <div className="container">
        <div className="border-b border-brand-navy/10 pb-6">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-navy">Your dashboard</h1>
          <p className="mt-2 text-brand-slate">Welcome back{user?.name ? `, ${user.name}` : ''}.</p>
        </div>

        {/* grid-cols-1 is minmax(0,1fr): without the 0 floor, on a phone the
            column grows to the pill row's full width and the cards run off
            the right edge of the screen. */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[224px_minmax(0,1fr)]">
          {/* Sidebar on a wide screen; a row of pills that scrolls sideways on a phone. */}
          <aside className="min-w-0">
            <nav
              className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
              aria-label="Dashboard sections"
            >
              {TABS.map((t) => (
                <NavLink
                  key={t.key}
                  to={`/dashboard/${t.key}`}
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-3 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                      isActive ? 'bg-brand-navy text-white' : 'text-brand-navy hover:bg-brand-navy/5'
                    }`
                  }
                >
                  <span className="shrink-0" aria-hidden>{ICON[t.icon]}</span>
                  {t.label}
                </NavLink>
              ))}
            </nav>
          </aside>

          <div className="min-w-0">
            {tab === 'services' && <ServicesPanel mentoring={mentoring} />}
            {tab === 'skill-build' && <SkillBuildPanel courses={courses} />}
            {tab === 'downloads' && <Downloads embedded />}
            {tab === 'settings' && <Settings embedded />}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Services (mentoring programs) ---------- */
function ServicesPanel({ mentoring }) {
  return (
    <div>
      <h2 className={PANEL_TITLE}>Services</h2>
      <p className="mt-1 text-sm text-brand-slate">Your mentoring programs and every session inside them.</p>

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
    </div>
  )
}

/* ---------- Skill Build (courses) ---------- */
function SkillBuildPanel({ courses }) {
  return (
    <div>
      <h2 className={PANEL_TITLE}>Skill-Build</h2>
      <p className="mt-1 text-sm text-brand-slate">Your courses, and where you are in each.</p>

      <div className="mt-4 space-y-5">
        {courses == null ? (
          <div className={CARD}><p className="text-brand-slate">Loading…</p></div>
        ) : courses.length === 0 ? (
          <div className={CARD}>
            <p className="text-brand-slate">You haven't enrolled in a Skill-Build course yet.</p>
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
                      {courseTitle(e.courseName, e.packageName)}
                    </h3>
                    <p className="mt-0.5 text-sm text-brand-slate">
                      {e.progress && e.progress.total > 0
                        ? `${e.progress.completed} of ${e.progress.total} sessions complete`
                        : 'Skill-Build subscription'}
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
    </div>
  )
}
