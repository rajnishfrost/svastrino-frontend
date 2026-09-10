import { useOrg } from '../../../common_component/org/OrgContext/OrgContext.jsx'
import '../../admin/adminShared.css'

/**
 * The organisation's landing screen: who they are, how many students they have
 * added, and what to do next.
 */
export default function OrgDashboard() {
  const { organisation, stats, typeLabel } = useOrg()
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
        {stats?.course && (
          <>
            <div className="adm-stat-card"><strong>{stats.course.enrolled}</strong><span>In {stats.course.name}</span></div>
            <div className="adm-stat-card"><strong>{stats.course.pending}</strong><span>Yet to set password</span></div>
            <div className="adm-stat-card"><strong>{stats.course.avgPercent}%</strong><span>Average progress</span></div>
            <div className="adm-stat-card"><strong>{stats.course.behind}</strong><span>Behind schedule</span></div>
          </>
        )}
      </div>

      {stats?.course && (
        <section className="adm-panel">
          <h2 style={{ fontSize: 17, marginBottom: 6 }}>{stats.course.name}</h2>
          <p className="adm-sub" style={{ margin: 0 }}>
            Allotted to every student you add — it opens the moment they set their password.{' '}
            {stats.course.started} started · {stats.course.onTrack} on track or ahead · {stats.course.behind} behind ·{' '}
            {stats.course.done} completed. The Students page shows each one.
          </p>
        </section>
      )}

      <section className="adm-panel">
        <h2 style={{ fontSize: 17, marginBottom: 6 }}>How it works</h2>
        <ol className="adm-sub" style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
          <li>Download the sample CSV — name, email, phone and class.</li>
          <li>Bulk-add your students from it; each one gets an email to set their password.</li>
          <li>They sign in and pick up from there.</li>
        </ol>
      </section>
    </div>
  )
}
