import { useEffect, useState } from 'react'
import { api } from '../../../api/client.js'
import { useOrg } from '../../../common_component/org/OrgContext/OrgContext.jsx'
import ScholarshipCycleEditor from '../../../common_component/scholarship/ScholarshipCycleEditor.jsx'
import '../../admin/adminShared.css'

/**
 * The organisation running its own scholarship, one cycle (year) at a time.
 *
 * Every request goes to /api/org/*, which is scoped to the signed-in
 * organisation server-side — there is no organisation id in any URL here, so
 * this page structurally cannot read another partner's data.
 */
export default function OrgScholarship() {
  const { refresh } = useOrg()
  const [cycles, setCycles] = useState(null)
  const [selected, setSelected] = useState(null) // cycle id
  const [error, setError] = useState('')
  const [showNew, setShowNew] = useState(false)

  const load = async (keepId) => {
    try {
      const d = await api('/org/scholarship/cycles', { auth: 'user' })
      setCycles(d.cycles)
      // Keep the current selection across a reload; otherwise land on the newest.
      setSelected((prev) => {
        const want = keepId || prev
        return d.cycles.find((c) => c.id === want)?.id || d.cycles[0]?.id || null
      })
    } catch (e) { setError(e.message) }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const cycle = cycles?.find((c) => c.id === selected) || null

  return (
    <div>
      <h1 className="adm-title">Scholarship</h1>
      <p className="adm-sub">
        Run one scholarship per year. Write your questions, set the test window, publish it —
        then watch enrolments come in and declare your winner.
      </p>

      {error && <p className="adm-error">{error}</p>}

      <div className="adm-toolbar">
        {cycles?.length > 0 && (
          <select className="adm-select" style={{ maxWidth: 320 }} value={selected || ''} onChange={(e) => setSelected(e.target.value)}>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>{c.year} — {c.title} ({c.status})</option>
            ))}
          </select>
        )}
        <button className="adm-btn" onClick={() => setShowNew(true)}>+ New year</button>
      </div>

      {!cycles ? (
        <p className="adm-empty">Loading…</p>
      ) : cycles.length === 0 ? (
        <p className="adm-empty">No scholarship cycles yet — create one for this year to get started.</p>
      ) : cycle ? (
        <ScholarshipCycleEditor
          key={cycle.id}
          cycle={cycle}
          basePath="/org/scholarship"
          auth="user"
          onChanged={() => { load(cycle.id); refresh() }}
          onDeleted={() => { setSelected(null); load(); refresh() }}
        />
      ) : null}

      {showNew && (
        <NewCycleModal
          existingYears={(cycles || []).map((c) => c.year)}
          onClose={() => setShowNew(false)}
          onDone={(id) => { setShowNew(false); load(id); refresh() }}
        />
      )}
    </div>
  )
}

/* ---------------- New cycle ---------------- */
function NewCycleModal({ existingYears, onClose, onDone }) {
  const thisYear = new Date().getFullYear()
  // Default to the first year they haven't used yet, so "+ New year" twice in a
  // row doesn't just re-offer a year that will 409.
  const suggested = [thisYear, thisYear + 1, thisYear + 2].find((y) => !existingYears.includes(y)) || thisYear
  const [year, setYear] = useState(suggested)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const d = await api('/org/scholarship/cycles', { method: 'POST', auth: 'user', body: { year: Number(year), title } })
      onDone(d.cycle.id)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="adm-modal-overlay" onClick={() => !busy && onClose()}>
      <form className="adm-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>New scholarship year</h3>
        <div className="adm-field"><label>Year</label>
          <input className="adm-input adm-num" type="number" min={thisYear - 1} max={thisYear + 5}
                 value={year} onChange={(e) => setYear(e.target.value)} required /></div>
        <div className="adm-field"><label>Title (optional)</label>
          <input className="adm-input" value={title} onChange={(e) => setTitle(e.target.value)}
                 placeholder={`Nirmaan Scholarship ${year}`} maxLength={120} /></div>
        <p className="adm-sub" style={{ margin: 0 }}>
          It starts as a draft — students can’t see it until you add questions, set a window and publish.
        </p>
        {error && <p className="adm-error">{error}</p>}
        <div className="adm-modal-actions">
          <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="adm-btn" disabled={busy}>{busy ? 'Creating…' : 'Create cycle'}</button>
        </div>
      </form>
    </div>
  )
}
