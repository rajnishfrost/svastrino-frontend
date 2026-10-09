import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../api/client.js'
import '../../admin/adminShared.css'
import { LIMITS } from '../../../utils/validate.js'
import { SkeletonTable } from '../../../common_component/Skeleton/Skeleton.jsx'

/**
 * Student Reports — where each of the institution's students is in the
 * psychometric test, and the way into the full reports.
 *
 * The table comes from our own records, which Mindler keeps current as students
 * use the site; "Refresh progress" asks Mindler again about tests still open.
 * The reports themselves live in the institution's admin on the assessment
 * site, opened from the button at the top.
 */
const STATUS = {
  completed: ['ok', 'Completed'],
  in_progress: ['warn', 'In progress'],
  not_started: ['muted', 'Not started'],
}

const when = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export default function OrgReports() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    api('/org/reports', { auth: 'user' }).then(setData).catch((e) => setError(e.message))
  }, [])

  const refresh = async () => {
    setRefreshing(true); setError('')
    try { setData(await api('/org/reports/refresh', { method: 'POST', auth: 'user' })) }
    catch (e) { setError(e.message) }
    finally { setRefreshing(false) }
  }

  const rows = useMemo(() => {
    if (!data) return null
    const term = q.trim().toLowerCase()
    return data.students.filter((s) =>
      (!status || s.status === status) &&
      (!term || s.name.toLowerCase().includes(term) || s.email.toLowerCase().includes(term)))
  }, [data, q, status])

  const m = data?.mindler

  return (
    <div>
      <h1 className="adm-title">Student Reports</h1>
      <p className="adm-sub">
        Where each of your students is in the psychometric test. Full reports open on the assessment site.
      </p>

      {error && <p className="adm-error">{error}</p>}

      {!data ? <SkeletonTable rows={6} cols={4} /> : (
        <>
          <div className="adm-stat-grid">
            <div className="adm-stat-card"><strong>{data.summary.total}</strong><span>Students</span></div>
            <div className="adm-stat-card"><strong>{data.summary.completed}</strong><span>Test completed</span></div>
            <div className="adm-stat-card"><strong>{data.summary.inProgress}</strong><span>In progress</span></div>
            <div className="adm-stat-card"><strong>{data.summary.notStarted}</strong><span>Not started</span></div>
          </div>

          <section className="adm-panel">
            <h2 style={{ fontSize: 17, marginBottom: 6 }}>Full reports</h2>
            {m.connected ? (
              <>
                <p className="adm-sub" style={{ marginTop: 0 }}>
                  Every finished student’s detailed and summary report, career matches and more.
                  Sign in there with <strong>{m.loginId}</strong>; it remembers you after the first time.
                </p>
                <a className="adm-btn" style={{ display: 'inline-block', textDecoration: 'none' }} href={m.adminUrl} target="_blank" rel="noreferrer">Open full reports ↗</a>
              </>
            ) : (
              <p className="adm-sub" style={{ margin: 0 }}>
                Your account on the assessment site is not set up yet. The Svastrino team will let you know
                once it is; until then, progress below still updates as your students take the test.
              </p>
            )}
          </section>

          <div className="adm-toolbar">
            <input className="adm-input" style={{ maxWidth: 240 }} placeholder="Search name or email…"
                   value={q} maxLength={LIMITS.search} onChange={(e) => setQ(e.target.value)} />
            <select className="adm-select" style={{ width: 170 }} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All students</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In progress</option>
              <option value="not_started">Not started</option>
            </select>
            <button className="adm-btn adm-btn--ghost" onClick={refresh} disabled={refreshing}>
              {refreshing ? 'Checking…' : 'Refresh progress'}
            </button>
          </div>

          {rows.length === 0 ? (
            <p className="adm-empty">
              {data.students.length === 0 ? 'No students added yet.' : 'No students match.'}
            </p>
          ) : (
            <div className="adm-panel adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Student</th><th>Class</th><th>Test</th><th>Status</th><th>Progress</th></tr></thead>
                <tbody>
                  {rows.map((s) => {
                    const [tone, label] = STATUS[s.status] || ['muted', s.status]
                    return (
                      <tr key={s.id}>
                        <td>{s.name}<div className="adm-sub" style={{ margin: 0 }}>{s.email}</div></td>
                        <td>{s.studentClass || '—'}</td>
                        <td>{s.testType || '—'}</td>
                        <td>
                          <span className={`adm-badge adm-badge--${tone}`}>{label}</span>
                          {s.status === 'completed' && s.completedAt && (
                            <div className="adm-sub" style={{ margin: 0 }}>{when(s.completedAt)}</div>
                          )}
                        </td>
                        <td>
                          {s.percent != null ? `${s.percent}%` : '—'}
                          {s.status === 'in_progress' && s.checkedAt && (
                            <div className="adm-sub" style={{ margin: 0 }}>as of {when(s.checkedAt)}</div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
