import { useEffect, useState } from 'react'
import { api, apiUpload } from '../../../api/client.js'
import '../adminShared.css'

const STATUS_CLS = { completed: 'ok', submitted: 'warn', in_progress: 'muted', not_started: 'muted' }
const STATUS_LABEL = {
  not_started: 'Not started',
  in_progress: 'In progress',
  submitted: 'Awaiting verification',
  completed: 'Completed',
}
const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

/**
 * Psychometric assessments (Mindler, handoff mode). Students take the test on
 * the white-label site and mark it done; here an admin verifies against the
 * partner portal and attaches the report, which flips it to 'completed'.
 */
export default function AdminAssessments() {
  const [rows, setRows] = useState(null)
  const [status, setStatus] = useState('submitted') // default = the pending queue
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // assessment being completed

  const load = (st = status) =>
    api(`/admin/assessments${st ? `?status=${st}` : ''}`, { auth: 'admin' })
      .then((d) => setRows(d.assessments))
      .catch((e) => setError(e.message))

  useEffect(() => { load() /* eslint-disable-next-line */ }, [status])

  const reopen = async (id) => {
    if (!confirm('Send this back to the student as “in progress”?')) return
    setError('')
    try {
      await api(`/admin/assessments/${id}/reopen`, { method: 'PATCH', auth: 'admin', body: {} })
      load()
    } catch (e) { setError(e.message) }
  }

  // Per-student Mindler coupon (generate it in the partner dashboard first,
  // then save it here — the student's Learn card shows it).
  const setCoupon = async (a) => {
    const couponCode = prompt('Mindler coupon code for this student:', a.couponCode || '')
    if (couponCode === null) return
    setError('')
    try {
      await api(`/admin/assessments/${a.id}/coupon`, { method: 'PATCH', auth: 'admin', body: { couponCode } })
      load()
    } catch (e) { setError(e.message) }
  }

  return (
    <div>
      <h1 className="adm-title">Psychometric assessments</h1>
      <p className="adm-sub">Verify a student’s Mindler test and attach their career report.</p>

      <div className="adm-toolbar">
        <select className="adm-select" style={{ width: 200 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="submitted">Awaiting verification</option>
          <option value="completed">Completed</option>
          <option value="in_progress">In progress</option>
          <option value="">All</option>
        </select>
      </div>

      {error && <p className="adm-error">{error}</p>}
      {!rows ? <p className="adm-empty">Loading…</p> : rows.length === 0 ? (
        <p className="adm-empty">Nothing here.</p>
      ) : (
        <div className="adm-panel adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Student</th><th>Product</th><th>Coupon</th><th>Submitted</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>{a.user ? <span title={a.user.email}>{a.user.name || a.user.email}</span> : '—'}</td>
                  <td>{a.product}</td>
                  <td>
                    <button className="adm-link" title="Generate in the Mindler partner dashboard, then save here"
                            onClick={() => setCoupon(a)}>
                      {a.couponCode || 'Set coupon'}
                    </button>
                  </td>
                  <td>{fmt(a.submittedAt || a.startedAt)}</td>
                  <td><span className={`adm-badge adm-badge--${STATUS_CLS[a.status] || 'muted'}`}>{STATUS_LABEL[a.status] || a.status}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="adm-link" onClick={() => setEditing(a)}>
                      {a.status === 'completed' ? 'Edit report' : 'Verify & attach'}
                    </button>
                    {a.status === 'completed' && (
                      <button className="adm-link" style={{ marginLeft: 12 }} onClick={() => reopen(a.id)}>Reopen</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <CompleteModal
          assessment={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </div>
  )
}

function CompleteModal({ assessment, onClose, onSaved }) {
  const r = assessment.report || {}
  const [reportUrl, setReportUrl] = useState(r.url || '')
  const [topCareers, setTopCareers] = useState((r.topCareers || []).join(', '))
  const [summary, setSummary] = useState(r.summary || '')
  const [uploadPct, setUploadPct] = useState(null) // null = idle
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // Upload the Mindler PDF (downloaded from the partner portal) → re-hosted URL.
  const uploadPdf = async (file) => {
    if (!file) return
    setErr(''); setUploadPct(0)
    try {
      const fd = new FormData()
      fd.append('report', file)
      const { url } = await apiUpload('/admin/assessments/report-pdf', fd, {
        auth: 'admin',
        onProgress: (p) => setUploadPct(p),
      })
      setReportUrl(url)
    } catch (e) {
      setErr(e.message)
    } finally {
      setUploadPct(null)
    }
  }

  const save = async () => {
    setBusy(true); setErr('')
    try {
      await api(`/admin/assessments/${assessment.id}/complete`, {
        method: 'PATCH', auth: 'admin',
        body: {
          reportUrl: reportUrl.trim(),
          topCareers: topCareers.split(',').map((s) => s.trim()).filter(Boolean),
          summary: summary.trim(),
        },
      })
      onSaved()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="adm-modal-title">Attach career report</h2>
        <p className="adm-sub" style={{ marginTop: -4 }}>
          {assessment.user?.name || assessment.user?.email} · {assessment.product}
        </p>

        <div className="adm-field">
          <label>Report PDF — recommended: download from Mindler (View Complete Report) and upload here</label>
          <input type="file" accept="application/pdf" className="adm-input"
                 onChange={(e) => uploadPdf(e.target.files?.[0])} disabled={uploadPct !== null} />
          {uploadPct !== null && <p className="adm-sub">Uploading… {uploadPct}%</p>}
        </div>
        <div className="adm-field">
          <label>
            …or paste the Mindler S3 link (quick, but it exposes the student’s name in the URL and
            can break if the report is regenerated)
          </label>
          <input className="adm-input" value={reportUrl} onChange={(e) => setReportUrl(e.target.value)}
                 placeholder="https://student-info.s3…amazonaws.com/…/report.pdf" />
          {reportUrl && uploadPct === null && (
            <p className="adm-ok">
              Report ready — <a href={reportUrl} target="_blank" rel="noopener noreferrer">preview</a>
            </p>
          )}
        </div>
        <div className="adm-field">
          <label>Top careers (comma-separated)</label>
          <input className="adm-input" value={topCareers} onChange={(e) => setTopCareers(e.target.value)} placeholder="Software Engineer, Data Analyst, …" />
        </div>
        <div className="adm-field">
          <label>Summary (optional)</label>
          <textarea className="adm-input" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>

        {err && <p className="adm-error">{err}</p>}
        <div className="adm-modal-actions">
          <button className="adm-btn adm-btn--ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="adm-btn" onClick={save} disabled={busy || uploadPct !== null || !reportUrl.trim()}>
            {busy ? 'Saving…' : 'Complete & attach'}
          </button>
        </div>
      </div>
    </div>
  )
}
