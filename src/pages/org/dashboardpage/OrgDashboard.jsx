import { Link } from 'react-router-dom'
import { useOrg } from '../../../common_component/org/OrgContext/OrgContext.jsx'
import '../../admin/adminShared.css'

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '—'

/**
 * The organisation's landing screen: where its scholarship stands right now and
 * the one action that matters next (add students → set up the cycle → publish).
 */
export default function OrgDashboard() {
  const { organisation, stats, currentCycle, can, typeLabel } = useOrg()
  if (!organisation) return null

  return (
    <div>
      <h1 className="adm-title">{organisation.name}</h1>
      <p className="adm-sub">
        {typeLabel}
        {organisation.city ? ` · ${organisation.city}` : ''}
        {organisation.state ? `, ${organisation.state}` : ''}
        {organisation.code ? ` · Code ${organisation.code}` : ''}
      </p>

      <div className="adm-stat-grid">
        <div className="adm-stat-card"><strong>{stats?.students ?? 0}</strong><span>Students added</span></div>
        <div className="adm-stat-card"><strong>{stats?.enrolments ?? 0}</strong><span>Scholarship enrolments</span></div>
        <div className="adm-stat-card"><strong>{stats?.submitted ?? 0}</strong><span>Tests submitted</span></div>
        <div className="adm-stat-card"><strong>{stats?.cycles ?? 0}</strong><span>Scholarship years</span></div>
      </div>

      <section className="adm-panel">
        <h2 style={{ fontSize: 17, marginBottom: 6 }}>This year’s scholarship</h2>
        {!currentCycle ? (
          <>
            <p className="adm-sub" style={{ marginBottom: 12 }}>
              You haven’t published a scholarship cycle yet. Create one for this year, add your
              questions and a test window, then publish it so your students can enrol.
            </p>
            {can('scholarship') && (
              <Link to="/organisation/scholarship" className="adm-btn">Set up this year’s scholarship</Link>
            )}
          </>
        ) : (
          <>
            <p style={{ marginBottom: 10 }}>
              <strong>{currentCycle.title}</strong>
              <span className={`adm-badge adm-badge--${currentCycle.open ? 'ok' : currentCycle.ended ? 'muted' : 'warn'}`} style={{ marginLeft: 8 }}>
                {currentCycle.open ? 'Test open' : currentCycle.upcoming ? 'Scheduled' : currentCycle.ended ? 'Closed' : 'Not scheduled'}
              </span>
            </p>
            <p className="adm-sub" style={{ marginBottom: 12 }}>
              {currentCycle.startAt
                ? <>Runs {fmtDate(currentCycle.startAt)} → {fmtDate(currentCycle.endAt)} · {currentCycle.durationMins} min per student.</>
                : 'No test window set yet.'}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {can('scholarship') && <Link to="/organisation/scholarship" className="adm-btn">Manage scholarship</Link>}
              {can('students') && <Link to="/organisation/students" className="adm-btn adm-btn--ghost">Add students</Link>}
            </div>
          </>
        )}
      </section>

      <section className="adm-panel">
        <h2 style={{ fontSize: 17, marginBottom: 6 }}>How it works</h2>
        <ol className="adm-sub" style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
          <li>Create this year’s cycle and write the questions students will answer.</li>
          <li>Set the test window and time limit, then publish the cycle.</li>
          <li>Bulk-add your students from a CSV — each one gets an email to set their password.</li>
          <li>Watch enrolments come in, then declare your winner once the window closes.</li>
        </ol>
      </section>
    </div>
  )
}
