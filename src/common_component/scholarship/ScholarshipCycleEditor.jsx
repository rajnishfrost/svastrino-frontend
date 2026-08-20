import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import ConfirmModal from '../admin/ConfirmModal/ConfirmModal.jsx'
import '../../pages/admin/adminShared.css'

/**
 * One scholarship cycle, fully manageable: settings, questions, enrolments and
 * results.
 *
 * Shared by the organisation portal and the admin panel because they manage the
 * exact same thing — the only difference is WHICH cycles you can reach, and
 * that's enforced on the server. So the caller passes the API namespace:
 *
 *   org   → basePath="/org/scholarship"    auth="user"   (scoped to their org)
 *   admin → basePath="/admin/scholarship"  auth="admin"  (any cycle)
 *
 * Keeping one component means a change to the results view can't drift between
 * what a partner sees and what admin sees.
 */
const TABS = [
  { key: 'settings', label: 'Test settings' },
  { key: 'questions', label: 'Questions' },
  { key: 'enrollments', label: 'Enrolments' },
  { key: 'results', label: 'Results' },
]

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '—'

const statusBadge = (c) =>
  c.status === 'archived' ? 'muted' : c.open ? 'ok' : c.status === 'published' ? 'warn' : 'muted'

const statusText = (c) =>
  c.status === 'draft' ? 'Draft — students can’t see it'
    : c.status === 'archived' ? 'Archived'
      : c.open ? 'Published · test open now'
        : c.upcoming ? 'Published · test scheduled'
          : c.ended ? 'Published · test closed'
            : 'Published · no window set'

export default function ScholarshipCycleEditor({ cycle, basePath, auth, onChanged, onDeleted }) {
  const [tab, setTab] = useState('settings')

  return (
    <>
      <div className="adm-panel" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <strong style={{ fontSize: 16 }}>{cycle.year} · {cycle.title}</strong>
          {cycle.organisationName && <div className="adm-sub" style={{ margin: 0 }}>{cycle.organisationName}</div>}
        </div>
        <span className={`adm-badge adm-badge--${statusBadge(cycle)}`}>{statusText(cycle)}</span>
      </div>

      <div className="adm-toolbar" style={{ gap: 8 }}>
        {TABS.map((t) => (
          <button key={t.key}
                  className={`adm-btn adm-btn--sm${tab === t.key ? '' : ' adm-btn--ghost'}`}
                  onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {tab === 'settings' && <Settings cycle={cycle} basePath={basePath} auth={auth} onChanged={onChanged} onDeleted={onDeleted} />}
      {tab === 'questions' && <Questions cycle={cycle} basePath={basePath} auth={auth} onChanged={onChanged} />}
      {tab === 'enrollments' && <Enrollments cycle={cycle} basePath={basePath} auth={auth} />}
      {tab === 'results' && <Results cycle={cycle} basePath={basePath} auth={auth} onChanged={onChanged} />}
    </>
  )
}

// ---- Settings ----------------------------------------------------------------
const toInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso); const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function Settings({ cycle, basePath, auth, onChanged, onDeleted }) {
  const [f, setF] = useState({
    title: cycle.title,
    instructions: cycle.instructions || '',
    startAt: toInput(cycle.startAt),
    endAt: toInput(cycle.endAt),
    durationMins: cycle.durationMins,
    active: cycle.active,
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setSaved(false) }

  const patch = async (extra = {}) => {
    setBusy(true); setError(''); setSaved(false)
    try {
      await api(`${basePath}/cycles/${cycle.id}`, {
        method: 'PATCH',
        auth,
        body: {
          title: f.title,
          instructions: f.instructions,
          durationMins: Number(f.durationMins),
          active: f.active,
          startAt: f.startAt ? new Date(f.startAt).toISOString() : null,
          endAt: f.endAt ? new Date(f.endAt).toISOString() : null,
          ...extra,
        },
      })
      setSaved(true)
      onChanged?.()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const remove = async () => {
    setBusy(true); setError('')
    try { await api(`${basePath}/cycles/${cycle.id}`, { method: 'DELETE', auth }); setConfirmDelete(false); onDeleted?.() }
    catch (e) { setError(e.message); setConfirmDelete(false) } finally { setBusy(false) }
  }

  const archived = cycle.status === 'archived'

  return (
    <section className="adm-panel" style={{ maxWidth: 660 }}>
      {archived && <p className="adm-sub">This cycle is archived and read-only — it’s kept as history.</p>}

      <div className="adm-field"><label>Test title</label>
        <input className="adm-input" value={f.title} disabled={archived} onChange={(e) => set('title', e.target.value)} /></div>
      <div className="adm-field"><label>Instructions (shown to students)</label>
        <textarea className="adm-input" rows={3} value={f.instructions} disabled={archived} onChange={(e) => set('instructions', e.target.value)} /></div>
      <div className="adm-row2">
        <div className="adm-field"><label>Starts</label>
          <input type="datetime-local" className="adm-input" value={f.startAt} disabled={archived} onChange={(e) => set('startAt', e.target.value)} /></div>
        <div className="adm-field"><label>Ends</label>
          <input type="datetime-local" className="adm-input" value={f.endAt} disabled={archived} onChange={(e) => set('endAt', e.target.value)} /></div>
      </div>
      <div className="adm-row2">
        <div className="adm-field"><label>Time limit (minutes, per student)</label>
          <input type="number" min="1" className="adm-input adm-num" value={f.durationMins} disabled={archived} onChange={(e) => set('durationMins', e.target.value)} /></div>
        <div className="adm-field"><label>Availability</label>
          <label style={{ fontSize: 14, display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <input type="checkbox" checked={f.active} disabled={archived} onChange={(e) => set('active', e.target.checked)} /> Accepting students
          </label>
        </div>
      </div>

      {error && <p className="adm-error">{error}</p>}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        {!archived && <button className="adm-btn" onClick={() => patch()} disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>}
        {cycle.status === 'draft' && (
          <button className="adm-btn adm-btn--ghost" onClick={() => patch({ status: 'published' })} disabled={busy}>
            Publish to students
          </button>
        )}
        {cycle.status === 'published' && (
          <>
            <button className="adm-btn adm-btn--ghost" onClick={() => patch({ status: 'draft' })} disabled={busy}>
              Unpublish
            </button>
            <button className="adm-btn adm-btn--ghost" onClick={() => patch({ status: 'archived' })} disabled={busy}>
              Archive this year
            </button>
          </>
        )}
        <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => setConfirmDelete(true)} disabled={busy}>
          Delete
        </button>
        {saved && <span className="adm-sub" style={{ margin: 0 }}>Saved ✓</span>}
      </div>

      <p className="adm-sub" style={{ marginTop: 12, marginBottom: 0 }}>
        Publishing needs at least one question and a start/end time. Archiving keeps everything
        readable but stops all changes.
      </p>

      {confirmDelete && (
        <ConfirmModal
          title={`Delete the ${cycle.year} cycle?`}
          message="Its questions and enrolments go with it. Only possible while no student has attempted the test — otherwise archive it instead."
          confirmLabel="Delete"
          danger
          busy={busy}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={remove}
        />
      )}
    </section>
  )
}

// ---- Questions ---------------------------------------------------------------
const blankQ = () => ({ prompt: '', guidance: '', maxWords: 1000 })
const mapQ = (q) => ({ prompt: q.prompt, guidance: q.guidance || '', maxWords: q.maxWords || 1000 })

function Questions({ cycle, basePath, auth, onChanged }) {
  const [qs, setQs] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api(`${basePath}/cycles/${cycle.id}/questions`, { auth })
      .then((d) => setQs(d.questions.length ? d.questions.map(mapQ) : [blankQ()]))
      .catch((e) => setError(e.message))
  }, [cycle.id, basePath, auth])

  const upd = (i, patch) => { setQs((p) => p.map((q, j) => (j === i ? { ...q, ...patch } : q))); setSaved(false) }

  const save = async () => {
    setBusy(true); setError(''); setSaved(false)
    try {
      const d = await api(`${basePath}/cycles/${cycle.id}/questions`, { method: 'PUT', auth, body: { questions: qs } })
      setQs(d.questions.length ? d.questions.map(mapQ) : [blankQ()])
      setSaved(true)
      onChanged?.()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  if (error && !qs) return <p className="adm-error">{error}</p>
  if (!qs) return <p className="adm-empty">Loading…</p>

  const locked = cycle.status === 'archived'

  return (
    <section>
      <p className="adm-sub">
        Open-ended, reflective questions — students type their answer (up to the word limit).
        Answers are graded by AI: <strong>1 mark each</strong>, awarded for a genuine, thoughtful response.
        Once a student submits, the questions lock so nobody’s score can shift underneath them.
      </p>
      {qs.map((q, i) => (
        <div key={i} className="adm-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <strong style={{ fontSize: 14 }}>Question {i + 1}</strong>
            {!locked && (
              <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setQs((p) => p.filter((_, j) => j !== i))}>Remove</button>
            )}
          </div>
          <div className="adm-field"><label>Question (what you ask the student)</label>
            <textarea className="adm-input" rows={2} value={q.prompt} disabled={locked} onChange={(e) => upd(i, { prompt: e.target.value })}
                      placeholder="e.g. What problem have you solved so far, and did you think you would solve it?" /></div>
          <div className="adm-field"><label>Grading guidance for the AI (optional — not shown to students)</label>
            <textarea className="adm-input" rows={2} value={q.guidance} disabled={locked} onChange={(e) => upd(i, { guidance: e.target.value })}
                      placeholder="What a strong answer shows — e.g. a specific real problem, honest reflection on doubts, what they learned." /></div>
          <div className="adm-field" style={{ maxWidth: 220 }}><label>Answer word limit</label>
            <input className="adm-input adm-num" type="number" min={20} max={1000} value={q.maxWords} disabled={locked}
                   onChange={(e) => upd(i, { maxWords: Number(e.target.value) })} /></div>
        </div>
      ))}
      {error && <p className="adm-error">{error}</p>}
      {!locked && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
          <button className="adm-btn adm-btn--ghost" onClick={() => setQs((p) => [...p, blankQ()])}>+ Add question</button>
          <button className="adm-btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save all questions'}</button>
          {saved && <span className="adm-sub" style={{ margin: 0 }}>Saved ✓</span>}
        </div>
      )}
    </section>
  )
}

// ---- Enrolments --------------------------------------------------------------
const SOURCE_LABEL = { self: 'Self-enrolled', bulk: 'CSV import', org: 'Added manually' }

function Enrollments({ cycle, basePath, auth }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [del, setDel] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = () =>
    api(`${basePath}/cycles/${cycle.id}/enrollments`, { auth })
      .then((d) => setRows(d.enrollments))
      .catch((e) => setError(e.message))

  useEffect(() => { load() }, [cycle.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const doRemove = async () => {
    setBusy(true); setError('')
    try { await api(`${basePath}/enrollments/${del.id}`, { method: 'DELETE', auth }); setDel(null); load() }
    catch (e) { setError(e.message); setDel(null) } finally { setBusy(false) }
  }

  if (error && !rows) return <p className="adm-error">{error}</p>
  if (!rows) return <p className="adm-empty">Loading…</p>

  return (
    <section>
      <p className="adm-sub"><strong>{rows.length}</strong> student{rows.length === 1 ? '' : 's'} enrolled for {cycle.year}.</p>
      {error && <p className="adm-error">{error}</p>}
      {rows.length === 0 ? <p className="adm-empty">No enrolments yet.</p> : (
        <div className="adm-panel adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Student</th><th>Class</th><th>Section</th><th>Roll no.</th><th>Added via</th><th>Test</th><th>Enrolled</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}<div className="adm-sub" style={{ margin: 0 }}>{r.email}</div></td>
                  <td>{r.studentClass || '—'}</td>
                  <td>{r.section || '—'}</td>
                  <td>{r.rollNo || '—'}</td>
                  <td className="adm-sub">{SOURCE_LABEL[r.source] || r.source}</td>
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
          message="This clears their enrolment and test attempt for this year, so they can enrol again. This can’t be undone."
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

// ---- Results -----------------------------------------------------------------
function Results({ cycle, basePath, auth, onChanged }) {
  const [rows, setRows] = useState(null)
  const [winner, setWinner] = useState(null)
  const [error, setError] = useState('')
  const [pick, setPick] = useState(null)   // row pending confirmation
  const [sheet, setSheet] = useState(null) // answer sheet being viewed
  const [busy, setBusy] = useState(false)

  const load = () =>
    api(`${basePath}/cycles/${cycle.id}/leaderboard`, { auth })
      .then((d) => { setRows(d.leaderboard); setWinner(d.declaredWinner) })
      .catch((e) => setError(e.message))

  useEffect(() => { load() }, [cycle.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const declare = async () => {
    setBusy(true); setError('')
    try {
      await api(`${basePath}/cycles/${cycle.id}/winner`, { method: 'POST', auth, body: { userId: pick.userId } })
      setPick(null); load(); onChanged?.()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const openSheet = async (row) => {
    setError('')
    try {
      const d = await api(`${basePath}/cycles/${cycle.id}/attempts/${row.userId}`, { auth })
      setSheet(d.attempt)
    } catch (e) { setError(e.message) }
  }

  if (error && !rows) return <p className="adm-error">{error}</p>
  if (!rows) return <p className="adm-empty">Loading…</p>
  if (rows.length === 0) return <p className="adm-empty">No submissions yet.</p>

  return (
    <>
      <p className="adm-sub">
        Ranked by score, with the earliest submission breaking a tie.
        Declaring a winner emails every student who took the test.
      </p>
      {error && <p className="adm-error">{error}</p>}
      <div className="adm-panel adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>#</th><th>Student</th><th>Class</th><th>Roll no.</th><th>Score</th><th>Submitted</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId || r.rank}>
                <td className="adm-num">{r.rank}</td>
                <td>
                  {r.name}
                  {String(winner) === String(r.userId) && <span className="adm-badge adm-badge--ok" style={{ marginLeft: 6 }}>Winner</span>}
                  <div className="adm-sub" style={{ margin: 0 }}>{r.email}</div>
                </td>
                <td>{r.studentClass || '—'}{r.section ? `-${r.section}` : ''}</td>
                <td>{r.rollNo || '—'}</td>
                <td><strong>{r.score}</strong> / {r.total}</td>
                <td className="adm-sub">{fmtDate(r.submittedAt)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="adm-link" onClick={() => openSheet(r)}>View answers</button>
                  {String(winner) !== String(r.userId) && (
                    <button className="adm-btn adm-btn--ghost adm-btn--sm" style={{ marginLeft: 6 }} onClick={() => setPick(r)}>Declare winner</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pick && (
        <ConfirmModal
          title="Declare winner?"
          message={`Declare ${pick.name} (${pick.score}/${pick.total}) as the ${cycle.year} scholarship winner? Everyone who took the test will be emailed the result.`}
          confirmLabel="Declare winner"
          busy={busy}
          onCancel={() => setPick(null)}
          onConfirm={declare}
        />
      )}

      {sheet && <AnswerSheet sheet={sheet} onClose={() => setSheet(null)} />}
    </>
  )
}

function AnswerSheet({ sheet, onClose }) {
  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal adm-modal--wide" onClick={(e) => e.stopPropagation()}>
        <h3>{sheet.student.name} — {sheet.score}/{sheet.total}</h3>
        <p className="adm-sub">
          {sheet.student.email} · submitted {fmtDate(sheet.submittedAt)}
          {sheet.gradedModel ? ` · graded by ${sheet.gradedModel}` : ''}
        </p>
        {sheet.answers.map((a, i) => (
          <div key={i} className="adm-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
              <strong style={{ fontSize: 14 }}>Q{i + 1}. {a.prompt}</strong>
              <span className={`adm-badge adm-badge--${a.awarded ? 'ok' : 'muted'}`}>{a.awarded}/1</span>
            </div>
            <p style={{ whiteSpace: 'pre-wrap', margin: '0 0 8px' }}>{a.text || <em>No answer</em>}</p>
            {a.feedback && <p className="adm-sub" style={{ margin: 0 }}><strong>AI note:</strong> {a.feedback}</p>}
          </div>
        ))}
        <div className="adm-modal-actions">
          <button className="adm-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
