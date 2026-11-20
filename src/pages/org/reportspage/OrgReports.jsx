import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../api/client.js'
import '../../admin/adminShared.css'
import { SkeletonTable } from '../../../common_component/Skeleton/Skeleton.jsx'

/**
 * Psychometric Report — every student registered with this institution and where
 * they are with the psychometric test, read through the same Mindler API the
 * student's own card uses (getAssessmentStatus). A student who has given the
 * test has a "View report" button: the report PDF from Mindler's
 * download-report, opened in a new tab.
 *
 * The page shows what we already know at once, then asks Mindler about open
 * tests in the background (POST /refresh) and updates the table.
 */

// Date and time, so the institution can see when a student sat the test and
// how long they took over it.
const fmtWhen = (d) => {
  if (!d) return '—'
  const t = new Date(d)
  return (
    <>
      {t.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      <div className="adm-sub" style={{ margin: 0, fontSize: 12.5 }}>
        {t.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
      </div>
    </>
  )
}

/** "2 days 3 hrs", "45 min" — from starting the test to finishing it. */
function timeTaken(from, to) {
  if (!from || !to) return null
  const mins = Math.max(0, Math.round((new Date(to) - new Date(from)) / 60000))
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ${mins % 60} min`
  const days = Math.floor(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ${hrs % 24} hr${hrs % 24 === 1 ? '' : 's'}`
}

function StatusBadge({ r }) {
  if (r.status === 'completed') return <span className="adm-badge adm-badge--ok">Test given</span>
  if (r.status === 'in_progress')
    return (
      <span className="adm-badge adm-badge--warn">
        In progress{r.percent != null ? ` · ${r.percent}%` : ''}
      </span>
    )
  return <span className="adm-badge adm-badge--muted">Not started</span>
}

/**
 * A tab opened after an API call is blocked by most browsers, so an empty one
 * opens inside the click and is pointed at the PDF once its link arrives.
 */
function openPendingTab() {
  const tab = window.open('', '_blank')
  if (!tab) return null
  try {
    tab.document.title = 'Svastrino'
    tab.document.body.innerHTML =
      '<p style="font:16px/1.5 system-ui,sans-serif;color:#1c2a4a;text-align:center;margin-top:30vh">Preparing the report — this takes a few seconds…</p>'
  } catch { /* the tab still works */ }
  return tab
}

export default function OrgReports() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [opening, setOpening] = useState(null) // student id whose report is loading

  const refresh = async () => {
    setRefreshing(true)
    try {
      setData(await api('/org/reports/refresh', { method: 'POST', auth: 'user' }))
    } catch (e) {
      setError(e.message)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let live = true
    api('/org/reports', { auth: 'user' })
      .then((d) => {
        if (!live) return
        setData(d)
        // Only ask Mindler again when there is an open test to ask about.
        if (d.summary?.inProgress) refresh()
      })
      .catch((e) => live && setError(e.message))
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (data?.students || []).filter(
      (r) =>
        (filter === 'all' || r.status === filter) &&
        (!needle || r.name.toLowerCase().includes(needle) || (r.email || '').toLowerCase().includes(needle))
    )
  }, [data, q, filter])

  const viewReport = async (r) => {
    setError('')
    setOpening(r.id)
    const tab = openPendingTab()
    try {
      const { url } = await api(`/org/reports/${r.id}/report-pdf`, { auth: 'user' })
      if (tab && !tab.closed) tab.location.href = url
      else if (!window.open(url, '_blank')) window.location.href = url
    } catch (e) {
      tab?.close()
      setError(e.message)
    } finally {
      setOpening(null)
    }
  }

  const s = data?.summary

  return (
    <div>
      <h1 className="adm-title">Psychometric Report</h1>
      <p className="adm-sub">
        Each of your students and their psychometric test. Once a student has given the test, you can read their report.
      </p>
      {error && <p className="adm-error">{error}</p>}

      {!data ? (!error && <SkeletonTable rows={6} cols={5} />) : (
        <>
          <div className="adm-stat-grid">
            <div className="adm-stat-card"><strong>{s.total}</strong><span>Students</span></div>
            <div className="adm-stat-card"><strong>{s.completed}</strong><span>Test given</span></div>
            <div className="adm-stat-card"><strong>{s.inProgress}</strong><span>In progress</span></div>
            <div className="adm-stat-card"><strong>{s.notStarted}</strong><span>Not started</span></div>
          </div>

          <div className="adm-toolbar">
            <input
              className="adm-input"
              type="search"
              placeholder="Search by name or email"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ maxWidth: 280 }}
            />
            <select className="adm-input" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ maxWidth: 180 }}>
              <option value="all">All students</option>
              <option value="completed">Test given</option>
              <option value="in_progress">In progress</option>
              <option value="not_started">Not started</option>
            </select>
            <button className="adm-btn adm-btn--ghost" onClick={refresh} disabled={refreshing}>
              {refreshing ? 'Checking…' : 'Refresh status'}
            </button>
          </div>

          <div className="adm-panel adm-table-wrap">
            {rows.length === 0 ? (
              <p className="adm-empty">
                {s.total === 0 ? 'No students have been added to your institute yet.' : 'No students match.'}
              </p>
            ) : (
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Test</th>
                    <th>Status</th>
                    <th>Started on</th>
                    <th>Completed on</th>
                    <th>Report</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.name}</strong>
                        <div className="adm-sub" style={{ margin: 0, fontSize: 13 }}>{r.email}</div>
                      </td>
                      <td>{r.studentClass || '—'}</td>
                      <td>{r.testType || '—'}</td>
                      <td><StatusBadge r={r} /></td>
                      <td>{r.status !== 'not_started' ? fmtWhen(r.startedAt) : '—'}</td>
                      <td>
                        {r.status === 'completed' ? fmtWhen(r.completedAt) : '—'}
                        {r.status === 'completed' && timeTaken(r.startedAt, r.completedAt) && (
                          <div className="adm-sub" style={{ margin: 0, fontSize: 12.5 }}>
                            Took {timeTaken(r.startedAt, r.completedAt)}
                          </div>
                        )}
                      </td>
                      <td>
                        {r.reportReady ? (
                          <button
                            className="adm-btn adm-btn--sm"
                            onClick={() => viewReport(r)}
                            disabled={opening === r.id}
                          >
                            {opening === r.id ? 'Preparing…' : 'View report'}
                          </button>
                        ) : (
                          <span className="adm-sub" style={{ margin: 0 }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
