import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, useParams } from 'react-router-dom'
import { BookOpen, Brain, CalendarDays } from 'lucide-react'
import { api } from '../../../api/client.js'
import { fetchMyMentoring } from '../../../api/mentoring.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import { usePsychometric } from '../../../hooks/usePsychometric.js'
import Downloads from '../downloadspage/Downloads.jsx'
import Settings from '../settingspage/Settings.jsx'
import { SkeletonList, SkeletonDashPanel, SkeletonDashboard } from '../../../common_component/Skeleton/Skeleton.jsx'
import { useKeyHold, useRevealFade } from '../../../common_component/Skeleton/useHold.js'

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
// Services is what a dashboard opens on: it is the first tab in the sidebar,
// and mentoring is the thing with dates in it — a session next Monday matters
// today in a way a course you can open any evening does not. Somewhere that
// knows what was just bought says so instead (see dashboardTabFor).
const DEFAULT_TAB = 'services'

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

const ACTION = 'inline-flex items-center gap-1 text-sm font-semibold text-brand-crimson hover:underline'
const PANEL_TITLE = 'font-display text-xl font-bold text-brand-navy'
// Nothing to show yet: a dashed card with one line and the way in.
const EMPTY = 'text-sm text-brand-slate'
// One item of a panel — a booked programme, an enrolment — as a white card on
// the dashboard's soft background, so each reads as its own thing on a phone
// instead of a run of loose lines.
const CARD = 'rounded-2xl border border-solid border-brand-navy/15 bg-white p-4 shadow-[0_12px_30px_-14px_rgba(15,44,92,0.4)] sm:p-6'
// The card's main call to action: full width on a phone (an easy thumb target),
// its natural width from a tablet up.
const CTA = 'inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl px-5 text-[13px] font-semibold text-white no-underline transition-colors sm:w-auto'
const ACTIVE_PILL = 'shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700'

/** Empty panel: a dashed card, a line, and the way in. */
function Empty({ text, to, cta }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-brand-navy/15 bg-white/70 p-6 text-center">
      <p className={EMPTY}>{text}</p>
      <Link to={to} className={`${ACTION} mt-3`}>{cta}</Link>
    </div>
  )
}

/** A slim progress bar, labelled above with its percentage. */
function Progress({ percent, bar, label = 'Progress' }) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)))
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-brand-slate">{label}</span>
        <span className="font-bold text-brand-navy">{pct}%</span>
      </div>
      {/* A track that reads even when empty: thicker, a clearer grey, and an
          inset edge — at 0% the bar is still plainly there. */}
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-200 shadow-[inset_0_1px_2px_rgba(15,44,92,0.18)] ring-1 ring-inset ring-slate-300/70">
        {pct > 0 && <span className={`block h-full rounded-full ${bar}`} style={{ width: `${Math.max(pct, 3)}%` }} />}
      </div>
    </div>
  )
}

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

  // Switching tabs: the sidebar answers at once, the panel sits on a skeleton
  // for a second (loading underneath) and then eases in — the same rhythm as
  // moving between pages anywhere else on the site.
  const panelHolding = useKeyHold(tab)
  const panelRef = useRevealFade(panelHolding)

  // No tab, or one that is not on the sidebar: go to the default. A redirect
  // rather than a silent fallback, so the address bar always says where you are.
  // No tab (straight after signing in, or a plain /dashboard link): open the
  // section for what the student actually has — their most recent purchase.
  // Nirmaan (a free trial included) or the psychometric test → Skill-Build;
  // a Svastrino programme → Services; nothing yet → the default tab.
  // Enrollments arrive newest first. Wait for them rather than guess.
  if (!TABS.some((t) => t.key === tab)) {
    if (enrollments == null) return <SkeletonDashboard />
    const latest = enrollments[0]
    const pick = !latest ? DEFAULT_TAB : latest.kind === 'mentoring' ? 'services' : 'skill-build'
    return <Navigate to={`/dashboard/${pick}`} replace />
  }

  const first = (user?.name || '').trim().split(/\s+/)[0]
  const initial = (first || user?.email || '?').charAt(0).toUpperCase()

  return (
    <section className="bg-soft py-6 md:py-12">
      <div className="container">
        {/* Welcome band: who is signed in, at a glance. */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy to-brand-blue-dark p-5 text-white shadow-[0_16px_36px_-18px_rgba(15,44,92,0.7)] sm:p-7">
          <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-white/10" />
          <span aria-hidden className="pointer-events-none absolute -bottom-16 right-16 size-32 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4">
            {user?.avatar ? (
              <img src={user.avatar} alt="" referrerPolicy="no-referrer" className="size-14 shrink-0 rounded-full object-cover ring-2 ring-white/40" />
            ) : (
              <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/15 font-display text-2xl font-bold ring-2 ring-white/30">
                {initial}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm text-white/70">Welcome back{first ? ',' : ''}</p>
              <h1 className="truncate font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {first || 'Dashboard'}
              </h1>
            </div>
          </div>
        </div>

        {/* grid-cols-1 is minmax(0,1fr): without the 0 floor, on a phone the
            column grows to the tab bar's full width and the cards run off the
            right edge of the screen. */}
        <div className="mt-5 grid grid-cols-1 gap-6 lg:mt-8 lg:grid-cols-[224px_minmax(0,1fr)] lg:gap-8">
          {/* Below 900px the four tabs are one segmented bar — icon over label,
              every tab and the one you're on always in view. From 900px it is
              the sidebar. */}
          <aside className="min-w-0">
            <nav
              className="grid grid-cols-4 gap-2 lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-1 lg:rounded-2xl lg:border lg:border-solid lg:border-brand-navy/10 lg:bg-white lg:p-2 lg:shadow-sm"
              aria-label="Dashboard sections"
            >
              {TABS.map((t) => (
                <NavLink
                  key={t.key}
                  to={`/dashboard/${t.key}`}
                  className={({ isActive }) =>
                    `flex min-w-0 flex-col items-center gap-1 rounded-xl border border-solid px-0.5 py-2.5 text-[10.5px] font-semibold no-underline transition-colors min-[380px]:text-xs lg:flex-row lg:gap-3 lg:border-0 lg:px-3.5 lg:py-2.5 lg:text-sm ${
                      isActive
                        ? 'border-brand-navy bg-brand-navy text-white shadow-md shadow-brand-navy/25'
                        : 'border-brand-navy/20 bg-white text-brand-navy shadow-[0_6px_16px_-8px_rgba(15,44,92,0.35)] hover:border-brand-navy/40 lg:bg-transparent lg:shadow-none lg:hover:bg-brand-navy/5'
                    }`
                  }
                >
                  <span className="shrink-0" aria-hidden>{ICON[t.icon]}</span>
                  <span className="max-w-full">{t.label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>

          <div className="min-w-0">
            {panelHolding && <SkeletonDashPanel label="Loading this section" />}
            <div ref={panelRef} style={panelHolding ? { display: 'none' } : undefined}>
              {tab === 'services' && <ServicesPanel mentoring={mentoring} />}
              {tab === 'skill-build' && <SkillBuildPanel courses={courses} />}
              {tab === 'downloads' && <Downloads embedded />}
              {tab === 'settings' && <Settings embedded />}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Services (mentoring programs) ---------- */

/** What a session's own actions are: book the next one, or move a booked one. */
function SessionAction({ p, s }) {
  if (!s.startAt && s.sessionNumber === p.sessionsBooked + 1) {
    return <Link to={`/book-online?program=${p.sku}`} className={ACTION}>Book →</Link>
  }
  if (canReschedule(s)) {
    return <Link to={`/book-online?program=${p.sku}&reschedule=${s.bookingId}`} className={ACTION}>Reschedule</Link>
  }
  return null
}

function ServicesPanel({ mentoring }) {
  return (
    <div>
      <h2 className={PANEL_TITLE}>Services</h2>

      <div className="mt-4 space-y-5">
        {mentoring == null ? (
          <SkeletonList rows={2} />
        ) : mentoring.length === 0 ? (
          <Empty text="You haven't booked a service yet." to="/book-online" cta="Book a session →" />
        ) : (
          mentoring.map((p) => (
            <div key={p.sku} className={CARD}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-base font-bold leading-snug text-brand-navy sm:text-lg">{p.name}</h3>
                  <p className="mt-1 text-[13px] leading-snug text-brand-slate sm:text-sm">
                    {p.sessionsBooked} of {p.sessionsTotal} sessions booked
                    {p.sessionsRemaining > 0 ? ` · ${p.sessionsRemaining} remaining` : ''}
                  </p>
                </div>
                <span className={ACTIVE_PILL}>Active</span>
              </div>
              {p.sessionsTotal > 0 && (
                <Progress percent={(p.sessionsBooked / p.sessionsTotal) * 100} bar="bg-brand-crimson" label="Sessions booked" />
              )}

              {/* Phones: one small card per session — a table here cut off its
                  right-hand columns. */}
              <ol className="mt-5 list-none space-y-3 p-0 md:hidden">
                {p.sessions.map((s) => {
                  const done = s.status === 'completed'
                  return (
                    <li key={s.sessionNumber} className="rounded-xl border border-solid border-brand-navy/10 bg-brand-cream p-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            done ? 'bg-green-600 text-white' : s.startAt ? 'bg-brand-navy text-white' : 'border-2 border-solid border-brand-navy/20 bg-white text-brand-navy'
                          }`}
                        >
                          {done ? '✓' : s.sessionNumber}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-brand-slate">Session {s.sessionNumber}</p>
                          <p className={`text-sm font-semibold ${s.startAt ? 'text-brand-navy' : 'text-brand-slate'}`}>
                            {s.startAt ? fmtWhen(s.startAt) : 'Not booked yet'}
                            {done && <span className="text-green-600"> · done</span>}
                          </p>
                        </div>
                        <span className="shrink-0"><SessionAction p={p} s={s} /></span>
                      </div>
                      {s.update && (
                        <div className="mt-3 border-0 border-t border-solid border-brand-navy/10 pt-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-brand-slate">Session update</p>
                          <p className="mt-1 text-sm leading-relaxed text-brand-navy">{s.update}</p>
                        </div>
                      )}
                      {s.tasks && s.tasks.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-brand-slate">Tasks</p>
                          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-brand-navy">
                            {s.tasks.map((t, i) => <li key={i}>{t}</li>)}
                          </ul>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ol>

              {/* Tablet and up: the full table. */}
              <div className="mt-5 hidden overflow-x-auto md:block">
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
                      <tr key={s.sessionNumber} className="border-b border-brand-navy/5 align-top text-brand-navy last:border-0">
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
                        <td className="py-3 text-right"><SessionAction p={p} s={s} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {p.sessionsRemaining > 0 && (
                <div className="mt-5">
                  <Link to={`/book-online?program=${p.sku}`} className={`${CTA} bg-brand-crimson hover:bg-brand-crimson-dark`}>
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

/* ---------- Psychometric test (under the Nirmaan card) ----------
   Where the test stands, with the way to the next step. The report itself is on
   the test site (My Report / My Result); the psychometric page's "See your
   report" signs the student in there, so every link here goes to that page. */
const PSY_LINE = {
  not_started: { text: 'Psychometric test: not taken yet', cta: 'Take your test →' },
  in_progress: { text: 'Psychometric test: in progress', cta: 'Continue your test →' },
  submitted: { text: 'Psychometric test: done', cta: 'See your report →' },
  completed: { text: 'Psychometric test: done', cta: 'See your report →' },
}

function PsychometricLine() {
  const { state, assessment } = usePsychometric('nirmaan')
  if (state !== 'owned' || !assessment) return null
  const line = PSY_LINE[assessment.status] || PSY_LINE.not_started
  const reportUrl = assessment.status === 'completed' ? assessment.report?.url : null
  const done = assessment.status === 'submitted' || assessment.status === 'completed'
  const status = line.text.replace(/^Psychometric test:\s*/, '').replace(/^./, (c) => c.toUpperCase())
  return (
    <div className="mt-4 rounded-xl bg-nirmaan-green/[0.08] px-3.5 py-3 text-[13px]">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-brand-navy">
          <Brain className="size-4 shrink-0 text-nirmaan-green" aria-hidden />
          <span className="truncate">Psychometric test</span>
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${done ? 'bg-nirmaan-green text-white' : 'bg-white text-nirmaan-green-dark'}`}>
          {status}
        </span>
      </div>
      {reportUrl ? (
        <a href={reportUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold text-nirmaan-green hover:underline">
          View your report →
        </a>
      ) : line.cta ? (
        <Link to="/skill-build/psychometric-testing" className="mt-2 inline-block font-semibold text-nirmaan-green hover:underline">
          {line.cta}
        </Link>
      ) : null}
    </div>
  )
}

/* ---------- Skill Build (courses) ---------- */
function SkillBuildPanel({ courses }) {
  // One psychometric line, under the first open Nirmaan card — an upgrade can
  // leave more than one Nirmaan row, and the test belongs to the student.
  // Bought on its own, the test has a card of its own, and the status line
  // goes there instead.
  const psyCardId = ((courses || []).find((e) => e.kind === 'test') || (courses || []).find(
    (e) => (e.courseSlug || 'nirmaan') === 'nirmaan' && accessState(e) === 'active'
  ))?.id
  return (
    <div>
      <h2 className={PANEL_TITLE}>Skill-Build</h2>

      <div className="mt-4 space-y-5">
        {courses == null ? (
          <SkeletonList rows={2} />
        ) : courses.length === 0 ? (
          <Empty text="You haven't enrolled in a Skill-Build course yet." to="/skill-build/nirmaan" cta="Explore Nirmaan →" />
        ) : (
          courses.map((e) => {
            const state = accessState(e)
            const open = state === 'active'
            const isTest = e.kind === 'test'
            const isNirmaan = isTest || (e.courseSlug || 'nirmaan') === 'nirmaan'
            const bar = isNirmaan ? 'bg-nirmaan-green' : 'bg-brand-crimson'
            return (
              <div key={e.id} className={CARD}>
                {/* Title on one line of its own; status and facts as chips under it. */}
                <div className="flex items-center gap-3">
                  <span aria-hidden className={`hidden size-10 shrink-0 items-center justify-center rounded-xl sm:flex ${isNirmaan ? 'bg-nirmaan-green/10 text-nirmaan-green' : 'bg-brand-crimson/10 text-brand-crimson'}`}>
                    {isTest ? <Brain className="size-5" /> : <BookOpen className="size-5" />}
                  </span>
                  <h3 className="min-w-0 truncate whitespace-nowrap font-display text-[15px] font-bold leading-snug text-brand-navy sm:text-lg" title={courseTitle(e.courseName, e.packageName)}>
                    {courseTitle(e.courseName, e.packageName)}
                  </h3>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5 text-[11.5px] font-medium text-brand-slate">
                  {open ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 font-semibold text-green-700">Active</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-brand-navy/10 px-2.5 py-1 font-semibold text-brand-slate">Closed</span>
                  )}
                  {isTest ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-navy/[0.05] px-2.5 py-1">
                      <Brain className="size-3.5" aria-hidden /> Stream or Career Selector
                    </span>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-navy/[0.05] px-2.5 py-1">
                        <BookOpen className="size-3.5" aria-hidden />
                        {e.progress && e.progress.total > 0
                          ? `${e.progress.completed}/${e.progress.total} lectures`
                          : 'Skill-Build subscription'}
                      </span>
                      {e.expiresAt && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-navy/[0.05] px-2.5 py-1">
                          <CalendarDays className="size-3.5" aria-hidden />
                          {open ? 'Valid till' : 'Ended'} {fmtDate(e.expiresAt)}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {e.progress && e.progress.total > 0 && <Progress percent={e.progress.percent} bar={bar} />}
                {e.id === psyCardId && <PsychometricLine />}
                <div className="mt-4">
                  {isTest ? (
                    <Link to="/skill-build/psychometric-testing" className={`${CTA} ${isNirmaan ? 'bg-nirmaan-green hover:bg-nirmaan-green-dark' : 'bg-brand-crimson hover:bg-brand-crimson-dark'}`}>
                      Go to your test →
                    </Link>
                  ) : e.progress && e.progress.total > 0 ? (
                    <Link to={`/learn/${e.courseSlug || 'nirmaan'}`} className={`${CTA} ${isNirmaan ? 'bg-nirmaan-green hover:bg-nirmaan-green-dark' : 'bg-brand-crimson hover:bg-brand-crimson-dark'}`}>
                      {open
                        ? e.progress.completed > 0 ? 'Continue learning →' : 'Start learning →'
                        : state === 'expired' ? 'Download your work →' : 'View course details →'}
                    </Link>
                  ) : (
                    <Link to={`/skill-build/${e.courseSlug || 'nirmaan'}#packages`} className={`${CTA} ${isNirmaan ? 'bg-nirmaan-green hover:bg-nirmaan-green-dark' : 'bg-brand-crimson hover:bg-brand-crimson-dark'}`}>
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
