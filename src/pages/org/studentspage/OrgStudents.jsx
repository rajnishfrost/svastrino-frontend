import { useEffect, useRef, useState } from 'react'
import { api, apiText, downloadText } from '../../../api/client.js'
import { useOrg } from '../../../common_component/org/OrgContext/OrgContext.jsx'
import ConfirmModal from '../../../common_component/admin/ConfirmModal/ConfirmModal.jsx'
import '../../admin/adminShared.css'

/**
 * The organisation's student roster.
 *
 * Bulk import is deliberately two-step: the CSV is sent once with `dryRun` and
 * the server returns the exact per-row outcome, which we render as a preview.
 * Only if the organisation confirms do we send it again for real — so nobody
 * discovers a typo'd column after 400 invite emails have gone out.
 */
export default function OrgStudents() {
  const { currentCycle, refresh } = useOrg()
  const [rows, setRows] = useState(null)
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [del, setDel] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = (search = q) =>
    api(`/org/students${search ? `?q=${encodeURIComponent(search)}` : ''}`, { auth: 'user' })
      .then((d) => setRows(d.students))
      .catch((e) => setError(e.message))

  useEffect(() => { load('') }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const afterChange = () => { load(); refresh() }

  const doRemove = async () => {
    setBusy(true); setError('')
    try {
      await api(`/org/students/${del.id}`, { method: 'DELETE', auth: 'user' })
      setDel(null); afterChange()
    } catch (e) { setError(e.message); setDel(null) } finally { setBusy(false) }
  }

  const downloadSample = async () => {
    try {
      downloadText('svastrino-students-sample.csv', await apiText('/org/students/sample.csv', { auth: 'user' }))
    } catch (e) { setError(e.message) }
  }

  return (
    <div>
      <h1 className="adm-title">Students</h1>
      <p className="adm-sub">
        Add your students once — each gets an email to set their password, and they’re entered into
        your current scholarship automatically.
        {currentCycle
          ? <> They’ll join <strong>{currentCycle.title}</strong>.</>
          : <> <strong>No published cycle yet</strong> — students you add now will be enrolled once you publish one.</>}
      </p>

      <div className="adm-toolbar">
        <input
          className="adm-input"
          style={{ maxWidth: 260 }}
          placeholder="Search name or email…"
          value={q}
          onChange={(e) => { setQ(e.target.value); load(e.target.value) }}
        />
        <button className="adm-btn" onClick={() => setShowImport(true)}>Bulk add from CSV</button>
        <button className="adm-btn adm-btn--ghost" onClick={() => setShowAdd(true)}>Add one student</button>
        <button className="adm-btn adm-btn--ghost" onClick={downloadSample}>Download sample CSV</button>
      </div>

      {error && <p className="adm-error">{error}</p>}

      {!rows ? <p className="adm-empty">Loading…</p> : rows.length === 0 ? (
        <p className="adm-empty">No students yet — start with “Bulk add from CSV”.</p>
      ) : (
        <>
          <p className="adm-sub"><strong>{rows.length}</strong> student{rows.length === 1 ? '' : 's'}.</p>
          <div className="adm-panel adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Student</th><th>Class</th><th>Section</th><th>Roll no.</th>
                  <th>Account</th><th>Scholarship</th><th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}<div className="adm-sub" style={{ margin: 0 }}>{r.email}</div></td>
                    <td>{r.studentClass || '—'}</td>
                    <td>{r.section || '—'}</td>
                    <td>{r.rollNo || '—'}</td>
                    <td>
                      {r.activated
                        ? <span className="adm-badge adm-badge--ok">Active</span>
                        : <span className="adm-badge adm-badge--warn">Invite sent</span>}
                    </td>
                    <td>
                      {r.attempt === 'submitted'
                        ? <span className="adm-badge adm-badge--ok">{r.score}/{r.total}</span>
                        : r.attempt === 'in_progress'
                          ? <span className="adm-badge adm-badge--warn">In progress</span>
                          : r.enrolled
                            ? <span className="adm-badge adm-badge--muted">Enrolled</span>
                            : <span className="adm-badge adm-badge--muted">Not enrolled</span>}
                    </td>
                    <td><button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setDel(r)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onDone={() => { setShowImport(false); afterChange() }}
          onSample={downloadSample}
        />
      )}
      {showAdd && (
        <AddStudentModal onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); afterChange() }} />
      )}
      {del && (
        <ConfirmModal
          title={`Remove ${del.name}?`}
          message="They’re removed from your organisation and this year’s scholarship. Their Svastrino account itself stays — they can still log in."
          confirmLabel="Remove"
          danger
          busy={busy}
          onCancel={() => setDel(null)}
          onConfirm={doRemove}
        />
      )}
    </div>
  )
}

/* ---------------- CSV import: preview, then commit ---------------- */
const STATUS_BADGE = {
  created: 'ok',
  linked: 'ok',
  existing: 'muted',
  skipped: 'muted',
  conflict: 'warn',
  error: 'warn',
}

function ImportModal({ onClose, onDone, onSample }) {
  const fileRef = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null) // dry-run report
  const [report, setReport] = useState(null)   // committed report
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const send = async (dryRun) => {
    if (!file) { setError('Choose a .csv file first.'); return }
    setBusy(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const d = await api(`/org/students/bulk?dryRun=${dryRun ? 1 : 0}`, { method: 'POST', auth: 'user', body: fd })
      if (dryRun) setPreview(d)
      else setReport(d)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const result = report || preview

  return (
    <div className="adm-modal-overlay" onClick={() => !busy && onClose()}>
      <div className="adm-modal adm-modal--wide" onClick={(e) => e.stopPropagation()}>
        <h3>{report ? 'Import complete' : 'Bulk add students'}</h3>

        {!result && (
          <>
            <p className="adm-sub">
              Your CSV needs these columns: <strong>name, email, phone, class, section, rollNo</strong>.
              Email is the one that must be filled in — it’s how each student signs in.
            </p>
            <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={onSample} style={{ marginBottom: 14 }}>
              Download the sample CSV
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => { setFile(e.target.files?.[0] || null); setError('') }}
              style={{ display: 'block', marginBottom: 12 }}
            />
          </>
        )}

        {result && (
          <>
            <p className="adm-sub">
              {report
                ? <><strong>{report.created}</strong> account{report.created === 1 ? '' : 's'} created and invited,{' '}
                    <strong>{report.linked + report.existing}</strong> existing linked, <strong>{report.conflicts + report.skipped + report.errors}</strong> skipped.</>
                : <>Preview of <strong>{preview.total}</strong> rows — nothing has been saved yet.</>}
            </p>
            <div className="adm-table-wrap" style={{ maxHeight: 320, overflowY: 'auto' }}>
              <table className="adm-table">
                <thead><tr><th>Row</th><th>Name</th><th>Email</th><th>Outcome</th></tr></thead>
                <tbody>
                  {result.results.map((r) => (
                    <tr key={r.line}>
                      <td className="adm-num">{r.line}</td>
                      <td>{r.name || '—'}</td>
                      <td>{r.email || '—'}</td>
                      <td>
                        <span className={`adm-badge adm-badge--${STATUS_BADGE[r.status] || 'muted'}`}>{r.status}</span>
                        <div className="adm-sub" style={{ margin: '4px 0 0' }}>{r.message}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {error && <p className="adm-error">{error}</p>}

        <div className="adm-modal-actions">
          {report ? (
            <button className="adm-btn" onClick={onDone}>Done</button>
          ) : preview ? (
            <>
              <button className="adm-btn adm-btn--ghost" onClick={() => { setPreview(null); setFile(null); if (fileRef.current) fileRef.current.value = '' }} disabled={busy}>
                Choose another file
              </button>
              <button className="adm-btn" onClick={() => send(false)} disabled={busy}>
                {busy ? 'Importing…' : `Import ${preview.total} students`}
              </button>
            </>
          ) : (
            <>
              <button className="adm-btn adm-btn--ghost" onClick={onClose} disabled={busy}>Cancel</button>
              <button className="adm-btn" onClick={() => send(true)} disabled={busy || !file}>
                {busy ? 'Checking…' : 'Preview import'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Single student ---------------- */
const BLANK = { name: '', email: '', phone: '', class: '', section: '', rollNo: '' }

function AddStudentModal({ onClose, onDone }) {
  const [f, setF] = useState(BLANK)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try { await api('/org/students', { method: 'POST', auth: 'user', body: f }); onDone() }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="adm-modal-overlay" onClick={() => !busy && onClose()}>
      <form className="adm-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>Add a student</h3>
        <div className="adm-field"><label>Full name</label>
          <input className="adm-input" value={f.name} onChange={(e) => set('name', e.target.value)} maxLength={80} /></div>
        <div className="adm-field"><label>Email (their login)</label>
          <input className="adm-input" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} required maxLength={254} /></div>
        <div className="adm-row2">
          <div className="adm-field"><label>Phone</label>
            <input className="adm-input" value={f.phone} onChange={(e) => set('phone', e.target.value)} maxLength={20} /></div>
          <div className="adm-field"><label>Class</label>
            <input className="adm-input" value={f.class} onChange={(e) => set('class', e.target.value)} maxLength={20} /></div>
        </div>
        <div className="adm-row2">
          <div className="adm-field"><label>Section</label>
            <input className="adm-input" value={f.section} onChange={(e) => set('section', e.target.value)} maxLength={20} /></div>
          <div className="adm-field"><label>Roll no.</label>
            <input className="adm-input" value={f.rollNo} onChange={(e) => set('rollNo', e.target.value)} maxLength={30} /></div>
        </div>
        {error && <p className="adm-error">{error}</p>}
        <div className="adm-modal-actions">
          <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="adm-btn" disabled={busy || !f.email.trim()}>{busy ? 'Adding…' : 'Add student'}</button>
        </div>
      </form>
    </div>
  )
}
