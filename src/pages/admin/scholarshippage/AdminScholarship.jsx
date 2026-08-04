import { useEffect, useState } from 'react'
import { api } from '../../../api/client.js'
import ConfirmModal from '../../../common_component/admin/ConfirmModal/ConfirmModal.jsx'
import '../adminShared.css'

/**
 * Nirmaan Scholarship admin: review institution partner applications, configure
 * the test window, manage MCQ questions (with answer key), and see the results
 * leaderboard. Gated by the 'scholarship' module.
 */
const TABS = [
  { key: 'institutions', label: 'Institutions' },
  { key: 'enrollments', label: 'Enrolments' },
  { key: 'test', label: 'Test settings' },
  { key: 'questions', label: 'Questions' },
  { key: 'results', label: 'Results' },
]

export default function AdminScholarship() {
  const [tab, setTab] = useState('institutions')
  return (
    <div>
      <h1 className="adm-title">Nirmaan Scholarship</h1>
      <p className="adm-sub">Approve partner institutions, set the test window, manage questions, and see results.</p>

      <div className="adm-toolbar" style={{ gap: 8 }}>
        {TABS.map((t) => (
          <button key={t.key}
                  className={`adm-btn adm-btn--sm${tab === t.key ? '' : ' adm-btn--ghost'}`}
                  onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {tab === 'institutions' && <Institutions />}
      {tab === 'enrollments' && <Enrollments />}
      {tab === 'test' && <TestSettings />}
      {tab === 'questions' && <Questions />}
      {tab === 'results' && <Results />}
    </div>
  )
}

// ---- Institutions -----------------------------------------------------------
function Institutions() {
  const [rows, setRows] = useState(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null) // { inst, action: 'approved' | 'rejected' }
  const [busy, setBusy] = useState(false)

  const load = (st = status) =>
    api(`/admin/scholarship/institutions${st ? `?status=${st}` : ''}`, { auth: 'admin' })
      .then((d) => setRows(d.institutions))
      .catch((e) => setError(e.message))

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const doReview = async (reason) => {
    const { inst, action } = modal
    setBusy(true); setError('')
    try {
      await api(`/admin/scholarship/institutions/${inst.id}`, {
        method: 'PATCH', auth: 'admin',
        body: { status: action, reason: action === 'rejected' ? reason : '' },
      })
      setModal(null); load()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <section>
      <div className="adm-toolbar">
        <select className="adm-select" style={{ width: 180 }} value={status}
                onChange={(e) => { setStatus(e.target.value); setRows(null); load(e.target.value) }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      {error && <p className="adm-error">{error}</p>}
      {!rows ? <p className="adm-empty">Loading…</p> : rows.length === 0 ? (
        <p className="adm-empty">No applications.</p>
      ) : (
        <div className="adm-panel adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Institution</th><th>Location</th><th>Contact</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id}>
                  <td>
                    <strong>{i.name}</strong>
                    <div className="adm-sub" style={{ margin: 0 }}>{i.type}{i.branch ? ` · ${i.branch}` : ''}</div>
                  </td>
                  <td>{[i.city, i.state].filter(Boolean).join(', ') || '—'}</td>
                  <td>
                    <div>{i.contactPerson || '—'}</div>
                    <div className="adm-sub" style={{ margin: 0 }}>{i.email}{i.phone ? ` · ${i.phone}` : ''}</div>
                  </td>
                  <td>
                    <span className={`adm-badge adm-badge--${i.status === 'approved' ? 'ok' : i.status === 'rejected' ? 'warn' : 'muted'}`}>{i.status}</span>
                    {i.status === 'rejected' && i.rejectionReason && (
                      <div className="adm-sub" style={{ margin: '4px 0 0', maxWidth: 220 }}>{i.rejectionReason}</div>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {i.status !== 'approved' && (
                      <button className="adm-btn adm-btn--sm" onClick={() => setModal({ inst: i, action: 'approved' })}>Approve</button>
                    )}
                    {i.status !== 'rejected' && (
                      <button className="adm-btn adm-btn--ghost adm-btn--sm" style={{ marginLeft: 6 }} onClick={() => setModal({ inst: i, action: 'rejected' })}>Reject</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ConfirmModal
          title={modal.action === 'approved' ? `Approve “${modal.inst.name}”?` : `Reject “${modal.inst.name}”?`}
          message={modal.action === 'approved'
            ? 'They’ll be emailed and their students can enrol.'
            : 'They’ll be emailed the outcome.'}
          confirmLabel={modal.action === 'approved' ? 'Approve' : 'Reject'}
          danger={modal.action === 'rejected'}
          input={modal.action === 'rejected' ? { label: 'Reason (optional — emailed to them)', placeholder: 'e.g. Not eligible this cycle' } : undefined}
          busy={busy}
          onCancel={() => setModal(null)}
          onConfirm={doReview}
        />
      )}
    </section>
  )
}

// ---- Test settings ----------------------------------------------------------
const toInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso); const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function TestSettings() {
  const [f, setF] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setSaved(false) }

  useEffect(() => {
    api('/admin/scholarship/test', { auth: 'admin' })
      .then((d) => setF({ ...d.test, startAt: toInput(d.test.startAt), endAt: toInput(d.test.endAt) }))
      .catch((e) => setError(e.message))
  }, [])

  const save = async () => {
    setBusy(true); setError(''); setSaved(false)
    try {
      const body = {
        title: f.title, instructions: f.instructions, durationMins: Number(f.durationMins), active: f.active,
        startAt: f.startAt ? new Date(f.startAt).toISOString() : null,
        endAt: f.endAt ? new Date(f.endAt).toISOString() : null,
      }
      const d = await api('/admin/scholarship/test', { method: 'PATCH', auth: 'admin', body })
      setF({ ...d.test, startAt: toInput(d.test.startAt), endAt: toInput(d.test.endAt) })
      setSaved(true)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  if (error) return <p className="adm-error">{error}</p>
  if (!f) return <p className="adm-empty">Loading…</p>

  return (
    <section className="adm-panel" style={{ maxWidth: 640 }}>
      <div className="adm-field"><label>Test title</label>
        <input className="adm-input" value={f.title} onChange={(e) => set('title', e.target.value)} /></div>
      <div className="adm-field"><label>Instructions (shown to students)</label>
        <textarea className="adm-input" rows={3} value={f.instructions} onChange={(e) => set('instructions', e.target.value)} /></div>
      <div className="adm-row2">
        <div className="adm-field"><label>Starts</label>
          <input type="datetime-local" className="adm-input" value={f.startAt} onChange={(e) => set('startAt', e.target.value)} /></div>
        <div className="adm-field"><label>Ends</label>
          <input type="datetime-local" className="adm-input" value={f.endAt} onChange={(e) => set('endAt', e.target.value)} /></div>
      </div>
      <div className="adm-row2">
        <div className="adm-field"><label>Time limit (minutes)</label>
          <input type="number" min="1" className="adm-input" value={f.durationMins} onChange={(e) => set('durationMins', e.target.value)} /></div>
        <div className="adm-field"><label>Status</label>
          <label style={{ fontSize: 14, display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} /> Test active
          </label>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
        <button className="adm-btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>
        {saved && <span className="adm-sub" style={{ margin: 0 }}>Saved ✓</span>}
      </div>
    </section>
  )
}

// ---- Questions --------------------------------------------------------------
const blankQ = () => ({ prompt: '', guidance: '', maxWords: 1000 })
const mapQ = (q) => ({ prompt: q.prompt, guidance: q.guidance || '', maxWords: q.maxWords || 1000 })

function Questions() {
  const [qs, setQs] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api('/admin/scholarship/questions', { auth: 'admin' })
      .then((d) => setQs(d.questions.length ? d.questions.map(mapQ) : [blankQ()]))
      .catch((e) => setError(e.message))
  }, [])

  const upd = (i, patch) => { setQs((p) => p.map((q, j) => (j === i ? { ...q, ...patch } : q))); setSaved(false) }

  const save = async () => {
    setBusy(true); setError(''); setSaved(false)
    try {
      const d = await api('/admin/scholarship/questions', { method: 'PUT', auth: 'admin', body: { questions: qs } })
      setQs(d.questions.length ? d.questions.map(mapQ) : [blankQ()])
      setSaved(true)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  if (error) return <p className="adm-error">{error}</p>
  if (!qs) return <p className="adm-empty">Loading…</p>

  return (
    <section>
      <p className="adm-sub">
        Open-ended, reflective questions — students type their answer (up to the word limit).
        Answers are graded by AI: <strong>1 mark each</strong>, awarded for a genuine, thoughtful response.
      </p>
      {qs.map((q, i) => (
        <div key={i} className="adm-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <strong style={{ fontSize: 14 }}>Question {i + 1}</strong>
            <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setQs((p) => p.filter((_, j) => j !== i))}>Remove</button>
          </div>
          <div className="adm-field"><label>Question (what you ask the student)</label>
            <textarea className="adm-input" rows={2} value={q.prompt} onChange={(e) => upd(i, { prompt: e.target.value })}
                      placeholder="e.g. What problem have you solved so far, and did you think you would solve it?" /></div>
          <div className="adm-field"><label>Grading guidance for the AI (optional — not shown to students)</label>
            <textarea className="adm-input" rows={2} value={q.guidance} onChange={(e) => upd(i, { guidance: e.target.value })}
                      placeholder="What a strong answer shows — e.g. a specific real problem, honest reflection on doubts, what they learned." /></div>
          <div className="adm-field" style={{ maxWidth: 220 }}><label>Answer word limit</label>
            <input className="adm-input adm-num" type="number" min={20} max={1000} value={q.maxWords}
                   onChange={(e) => upd(i, { maxWords: Number(e.target.value) })} /></div>
        </div>
      ))}
      {error && <p className="adm-error">{error}</p>}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
        <button className="adm-btn adm-btn--ghost" onClick={() => setQs((p) => [...p, blankQ()])}>+ Add question</button>
        <button className="adm-btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save all questions'}</button>
        {saved && <span className="adm-sub" style={{ margin: 0 }}>Saved ✓</span>}
      </div>
    </section>
  )
}

// ---- Enrolments -------------------------------------------------------------
function Enrollments() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [del, setDel] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = () => api('/admin/scholarship/enrollments', { auth: 'admin' }).then((d) => setRows(d.enrollments)).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  const doRemove = async () => {
    setBusy(true); setError('')
    try { await api(`/admin/scholarship/enrollments/${del.id}`, { method: 'DELETE', auth: 'admin' }); setDel(null); load() }
    catch (e) { setError(e.message); setDel(null) } finally { setBusy(false) }
  }

  if (error) return <p className="adm-error">{error}</p>
  if (!rows) return <p className="adm-empty">Loading…</p>

  return (
    <section>
      <p className="adm-sub"><strong>{rows.length}</strong> student{rows.length === 1 ? '' : 's'} enrolled.</p>
      {rows.length === 0 ? <p className="adm-empty">No enrolments yet.</p> : (
        <div className="adm-panel adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Student</th><th>Institution</th><th>Class</th><th>Section</th><th>Roll no.</th><th>Test</th><th>Enrolled</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}<div className="adm-sub" style={{ margin: 0 }}>{r.email}</div></td>
                  <td>{r.institution}{r.branch ? ` · ${r.branch}` : ''}</td>
                  <td>{r.studentClass || '—'}</td>
                  <td>{r.section || '—'}</td>
                  <td>{r.rollNo || '—'}</td>
                  <td>{r.attempt === 'submitted'
                    ? <span className="adm-badge adm-badge--ok">{r.score}/{r.total}</span>
                    : r.attempt === 'in_progress'
                      ? <span className="adm-badge adm-badge--warn">In progress</span>
                      : <span className="adm-badge adm-badge--muted">Not started</span>}</td>
                  <td className="adm-sub">{r.enrolledAt ? new Date(r.enrolledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                  <td><button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setDel(r)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {del && (
        <ConfirmModal
          title={`Remove ${del.name}’s enrolment?`}
          message="This clears their enrolment and test attempt so they can enrol again. This can’t be undone."
          confirmLabel="Remove"
          danger
          busy={busy}
          onCancel={() => setDel(null)}
          onConfirm={doRemove}
        />
      )}
    </section>
  )
}

// ---- Results ----------------------------------------------------------------
function Results() {
  const [rows, setRows] = useState(null)
  const [winner, setWinner] = useState(null)
  const [error, setError] = useState('')
  const [pick, setPick] = useState(null) // row pending confirmation
  const [busy, setBusy] = useState(false)

  const load = () => {
    api('/admin/scholarship/leaderboard', { auth: 'admin' }).then((d) => setRows(d.leaderboard)).catch((e) => setError(e.message))
    api('/admin/scholarship/test', { auth: 'admin' }).then((d) => setWinner(d.test.declaredWinner)).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const declare = async () => {
    setBusy(true); setError('')
    try { await api('/admin/scholarship/winner', { method: 'POST', auth: 'admin', body: { userId: pick.userId } }); setPick(null); load() }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  if (error) return <p className="adm-error">{error}</p>
  if (!rows) return <p className="adm-empty">Loading…</p>
  if (rows.length === 0) return <p className="adm-empty">No submissions yet.</p>

  return (
    <>
      <div className="adm-panel adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>#</th><th>Student</th><th>Institution</th><th>Score</th><th>Submitted</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId || r.rank}>
                <td>{r.rank}</td>
                <td>{r.name}{String(winner) === String(r.userId) && <span className="adm-badge adm-badge--ok" style={{ marginLeft: 6 }}>Winner</span>}<div className="adm-sub" style={{ margin: 0 }}>{r.email}</div></td>
                <td>{r.institution}</td>
                <td><strong>{r.score}</strong> / {r.total}</td>
                <td className="adm-sub">{r.submittedAt ? new Date(r.submittedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : '—'}</td>
                <td><button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setPick(r)}>Declare winner</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pick && (
        <ConfirmModal
          title={`Declare winner?`}
          message={`Declare ${pick.name} (${pick.score}/${pick.total}) as the scholarship winner?`}
          confirmLabel="Declare winner"
          busy={busy}
          onCancel={() => setPick(null)}
          onConfirm={declare}
        />
      )}
    </>
  )
}
