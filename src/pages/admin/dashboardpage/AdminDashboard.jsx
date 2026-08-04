import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../../api/client.js'
import '../adminShared.css'
import './AdminDashboard.css'

const inr = (n) => '₹' + Number(n).toLocaleString('en-IN')
const num = (n) => Number(n || 0).toLocaleString('en-IN')

// Small inline icons (match the sidebar style).
const I = {
  revenue: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
  orders: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></>,
  students: <><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c3 2.5 9 2.5 12 0v-5" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></>,
  check: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m22 4-10 10-3-3" /></>,
  avg: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></>,
  refund: <><path d="M3 7v6h6" /><path d="M3 13a9 9 0 1 0 3-7.7L3 8" /></>,
}
const Ico = ({ d }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>
)

const ACTIONS = [
  { module: 'skill-builds', to: '/admin/skill-builds', label: 'Skill Builds & pricing', desc: 'Courses, tiers and prices' },
  { module: 'content', to: '/admin/content', label: 'Course content', desc: 'Videos, sessions & questions' },
  { module: 'mentoring', to: '/admin/mentoring', label: 'Mentoring', desc: 'Bookings, notes & programs' },
  { module: 'orders', to: '/admin/orders', label: 'Orders & revenue', desc: 'Transactions and refunds' },
  { module: 'coupons', to: '/admin/coupons', label: 'Coupons', desc: 'Discount codes' },
  { module: 'users', to: '/admin/users', label: 'Users', desc: 'Accounts and roles' },
  { module: 'assessments', to: '/admin/assessments', label: 'Assessments', desc: 'Psychometric reports' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [me, setMe] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/admin/stats', { auth: 'admin' }).then(setStats).catch((e) => setError(e.message))
    api('/admin/auth/me', { auth: 'admin' }).then((d) => setMe(d.admin)).catch(() => {})
  }, [])

  const canSee = (m) => me && (me.role === 'superadmin' || (me.permissions || []).includes(m))
  const firstName = (me?.name || '').trim().split(/\s+/)[0]

  const primary = stats ? [
    { key: 'rev', icon: I.revenue, label: 'Net revenue', value: inr(stats.netRevenueInr), accent: 'green',
      sub: stats.refundedInr > 0 ? `${inr(stats.revenueInr)} gross · ${inr(stats.refundedInr)} refunded` : `${inr(stats.revenueInr)} gross` },
    { key: 'ord', icon: I.orders, label: 'Paid orders', value: num(stats.paidOrders), accent: 'blue',
      sub: stats.avgOrderInr ? `avg ${inr(stats.avgOrderInr)} / order` : null },
    { key: 'stu', icon: I.students, label: 'Active students', value: num(stats.activeStudents), accent: 'violet',
      sub: `${num(stats.courses)} live course${stats.courses === 1 ? '' : 's'}` },
    { key: 'ses', icon: I.calendar, label: 'Upcoming sessions', value: num(stats.upcomingBookings), accent: 'amber',
      sub: `${num(stats.totalBookings)} booked all-time` },
  ] : []

  const secondary = stats ? [
    { key: 'usr', icon: I.users, label: 'Total users', value: num(stats.users),
      sub: stats.newUsers7d > 0 ? `+${num(stats.newUsers7d)} this week` : 'no new signups this week' },
    { key: 'ver', icon: I.check, label: 'Verified users', value: num(stats.verifiedUsers),
      sub: `${Math.round((stats.verifiedUsers / (stats.users || 1)) * 100)}% of users` },
    { key: 'aov', icon: I.avg, label: 'Avg order value', value: inr(stats.avgOrderInr) },
    { key: 'ref', icon: I.refund, label: 'Refunded', value: inr(stats.refundedInr) },
  ] : []

  return (
    <div>
      <h1 className="adm-title">{firstName ? `Welcome back, ${firstName}` : 'Dashboard'}</h1>
      <p className="adm-sub">Here’s how Svastrino is doing today.</p>

      {error && <p className="adm-error">{error}</p>}
      {!stats && !error && <p className="adm-empty">Loading…</p>}

      {stats && (
        <>
          <div className="dash-kpi-grid">
            {primary.map((t) => (
              <div key={t.key} className={`dash-kpi dash-kpi--${t.accent}`}>
                <span className="dash-kpi-icon"><Ico d={t.icon} /></span>
                <div className="dash-kpi-body">
                  <span className="dash-kpi-label">{t.label}</span>
                  <strong className="dash-kpi-value">{t.value}</strong>
                  {t.sub && <span className="dash-kpi-sub">{t.sub}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="dash-mini-grid">
            {secondary.map((t) => (
              <div key={t.key} className="dash-mini">
                <span className="dash-mini-icon"><Ico d={t.icon} /></span>
                <div>
                  <strong className="dash-mini-value">{t.value}</strong>
                  <span className="dash-mini-label">{t.label}</span>
                  {t.sub && <span className="dash-mini-sub">{t.sub}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="dash-section-h">Quick actions</h2>
      <div className="dash-actions">
        {ACTIONS.filter((a) => canSee(a.module)).map((a) => (
          <Link key={a.to} to={a.to} className="dash-action-card">
            <div>
              <strong>{a.label}</strong>
              <span>{a.desc}</span>
            </div>
            <span className="dash-action-arrow" aria-hidden>→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
