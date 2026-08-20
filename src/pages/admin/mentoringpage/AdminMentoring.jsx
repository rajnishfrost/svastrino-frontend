import { useEffect, useState } from 'react'
import { api } from '../../../api/client.js'
import '../adminShared.css'

/**
 * Services admin — two tabs:
 *   Bookings  → every appointment; the mentor writes per-session updates/tasks
 *               (shown verbatim in the student's dashboard table).
 *   Programs  → the Services catalog, grouped by sub-category
 *               (Career Counselling → Bull's Eye · Personalised Mentoring →
 *               Bloom, Breakthrough). Create & edit programs here.
 */
const STATUS_CLS = { booked: 'ok', completed: 'muted', cancelled: 'warn' }
const toPaise = (r) => (r === '' || r == null ? null : Math.round(Number(r) * 100))
const slugify = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const fmtWhen = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        weekday: 'short', day: '2-digit', month: 'short',
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
      })
    : '—'

export default function AdminMentoring() {
  const [tab, setTab] = useState('bookings') // 'bookings' | 'programs'

  return (
    <div>
      <h1 className="adm-title">Services</h1>
      <p className="adm-sub">
        Bookings and session notes, plus the Services catalog grouped by sub-category
        (Career Counselling, Personalised Mentoring).
      </p>

      <div className="adm-toolbar">
        <button className={`adm-btn adm-btn--sm ${tab === 'bookings' ? '' : 'adm-btn--ghost'}`} onClick={() => setTab('bookings')}>
          Bookings
        </button>
        <button className={`adm-btn adm-btn--sm ${tab === 'programs' ? '' : 'adm-btn--ghost'}`} onClick={() => setTab('programs')}>
          Programs
        </button>
      </div>

      {tab === 'bookings' ? <BookingsTab /> : <ProgramsTab />}
    </div>
  )
}

/* ============================ Bookings tab ============================ */

function BookingsTab() {
  const [bookings, setBookings] = useState(null)
  const [programs, setPrograms] = useState([])
  const [sku, setSku] = useState('')
  const [status, setStatus] = useState('')
  const [when, setWhen] = useState('upcoming')
  const [error, setError] = useState('')
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ update: '', tasks: '', status: 'booked' })
  const [busy, setBusy] = useState(false)

  const load = () => {
    const qs = new URLSearchParams()
    if (status) qs.set('status', status)
    if (when) qs.set('when', when)
    api(`/admin/mentoring/bookings?${qs.toString()}`, { auth: 'admin' })
      .then((d) => setBookings(d.bookings))
      .catch((e) => setError(e.message))
  }

  useEffect(() => {
    api('/admin/mentoring/programs', { auth: 'admin' })
      .then((d) => setPrograms(d.programs || []))
      .catch(() => {})
  }, [])
  useEffect(() => { load() /* eslint-disable-next-line */ }, [status, when])

  const rows = (bookings || []).filter((b) => !sku || b.programSku === sku)

  const startEdit = (b) => {
    setEditId(b.id)
    setForm({ update: b.update || '', tasks: (b.tasks || []).join('\n'), status: b.status })
  }

  const save = async (id) => {
    setBusy(true); setError('')
    try {
      await api(`/admin/mentoring/bookings/${id}`, {
        method: 'PATCH',
        auth: 'admin',
        body: {
          update: form.update,
          tasks: form.tasks.split('\n').map((t) => t.trim()).filter(Boolean),
          status: form.status,
        },
      })
      setEditId(null)
      load()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <div>
      <div className="adm-toolbar">
        <select className="adm-select" style={{ width: 200 }} value={sku} onChange={(e) => setSku(e.target.value)}>
          <option value="">All programs</option>
          {programs.map((p) => <option key={p.sku} value={p.sku}>{p.name}</option>)}
        </select>
        <select className="adm-select" style={{ width: 160 }} value={when} onChange={(e) => setWhen(e.target.value)}>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
          <option value="">All dates</option>
        </select>
        <select className="adm-select" style={{ width: 160 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="booked">Booked</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && <p className="adm-error">{error}</p>}
      {!bookings ? <p className="adm-empty">Loading…</p> : rows.length === 0 ? (
        <p className="adm-empty">No bookings.</p>
      ) : (
        <div className="adm-panel adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Student</th><th>Program</th><th>Session</th><th>Appointment (IST)</th><th>Status</th><th>Update / tasks</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                editId === b.id ? (
                  <tr key={b.id} className="adm-edit-row">
                    <td colSpan={7}>
                      <div className="adm-ment-edit">
                        <strong>{b.user?.name}</strong> · {b.programName} · session #{b.sessionNumber} · {fmtWhen(b.startAt)}
                        <label className="adm-label">Session update (visible to the student)
                          <textarea className="adm-input" rows={3} value={form.update}
                                    onChange={(e) => setForm({ ...form, update: e.target.value })}
                                    placeholder="What was covered, key takeaways…" />
                        </label>
                        <label className="adm-label">Tasks — one per line
                          <textarea className="adm-input" rows={3} value={form.tasks}
                                    onChange={(e) => setForm({ ...form, tasks: e.target.value })}
                                    placeholder={'Research 3 colleges\nDraft SOP outline'} />
                        </label>
                        <label className="adm-label">Status
                          <select className="adm-select" style={{ width: 160 }} value={form.status}
                                  onChange={(e) => setForm({ ...form, status: e.target.value })}>
                            <option value="booked">Booked</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </label>
                        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                          <button className="adm-btn" disabled={busy} onClick={() => save(b.id)}>
                            {busy ? 'Saving…' : 'Save'}
                          </button>
                          <button className="adm-link" disabled={busy} onClick={() => setEditId(null)}>Cancel</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={b.id}>
                    <td>{b.user ? <span title={b.user.email}>{b.user.name || b.user.email}</span> : '—'}</td>
                    <td>{b.programName}</td>
                    <td className="adm-num">#{b.sessionNumber}</td>
                    <td>{fmtWhen(b.startAt)}</td>
                    <td><span className={`adm-badge adm-badge--${STATUS_CLS[b.status] || 'muted'}`}>{b.status}</span></td>
                    <td className="adm-ment-notes">
                      {b.update ? <span title={b.update}>{b.update.slice(0, 60)}{b.update.length > 60 ? '…' : ''}</span> : '—'}
                      {b.tasks?.length > 0 && <span className="adm-badge adm-badge--muted" style={{ marginLeft: 6 }}>{b.tasks.length} task{b.tasks.length > 1 ? 's' : ''}</span>}
                    </td>
                    <td><button className="adm-link" onClick={() => startEdit(b)}>Edit</button></td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ============================ Programs tab ============================ */

function ProgramsTab() {
  const [programs, setPrograms] = useState(null) // mentoring packages
  const [subcats, setSubcats] = useState([]) // Services sub-categories (kind='mentoring')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // package id
  const [adding, setAdding] = useState(false)

  const load = () => {
    api('/admin/packages', { auth: 'admin' })
      .then((d) => setPrograms(d.packages.filter((p) => p.skillBuild?.kind === 'mentoring')))
      .catch((e) => setError(e.message))
    api('/admin/skill-builds?all=1', { auth: 'admin' })
      .then((d) => setSubcats((d.skillBuilds || []).filter((b) => b.kind === 'mentoring')))
      .catch(() => {})
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="adm-toolbar">
        <button className="adm-btn adm-btn--sm" onClick={() => setAdding(!adding)}>+ New program</button>
      </div>

      {adding && (
        <div className="adm-panel">
          <ProgramForm subcats={subcats} onCancel={() => setAdding(false)} onSaved={() => { setAdding(false); load() }} />
        </div>
      )}

      {error && <p className="adm-error">{error}</p>}
      {!programs && !error && <p className="adm-empty">Loading…</p>}

      {/* Grouped by Services sub-category */}
      {programs && subcats.map((sc) => {
        const items = programs.filter((p) => p.skillBuild?.slug === sc.slug)
        if (!items.length) return null
        return (
          <section key={sc.slug} style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', margin: '18px 0 10px' }}>
              {sc.name}
            </h2>
            {items.map((p) => (
              <div key={p.id} className="adm-panel">
                {editing === p.id ? (
                  <ProgramForm pkg={p} subcats={subcats} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ fontSize: 18 }}>{p.name}
                        {' '}<span className={`adm-badge adm-badge--${p.active ? 'ok' : 'muted'}`}>{p.active ? 'Active' : 'Hidden'}</span>
                        {p.featured && <span className="adm-badge adm-badge--warn" style={{ marginLeft: 6 }}>Featured</span>}
                      </h3>
                      <p className="adm-sub" style={{ margin: '4px 0 8px' }}>
                        ₹{p.priceInr.toLocaleString('en-IN')}
                        {p.earlyBirdInr != null && ` · early bird ₹${p.earlyBirdInr.toLocaleString('en-IN')}`}
                        {p.sessionsCount != null && ` · ${p.sessionsCount} session${p.sessionsCount > 1 ? 's' : ''} × ${(p.sessionMins || 120) / 60} hrs`}
                        {` · SKU: ${p.sku}`}
                      </p>
                      <ul style={{ fontSize: 13.5, color: 'var(--color-text-muted)', listStyle: 'disc', paddingLeft: 18 }}>
                        {p.features.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                    <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setEditing(p.id)}>Edit</button>
                  </div>
                )}
              </div>
            ))}
          </section>
        )
      })}
    </div>
  )
}

/** Create/edit a Services program (a package under a sub-category). */
function ProgramForm({ pkg, subcats = [], onCancel, onSaved }) {
  const isNew = !pkg
  const [f, setF] = useState({
    skillBuildSlug: pkg?.skillBuild?.slug || subcats[0]?.slug || '',
    name: pkg?.name || '', sku: pkg?.sku || '', tagline: pkg?.tagline || '',
    priceInr: pkg?.priceInr ?? '', earlyBirdInr: pkg?.earlyBirdInr ?? '',
    sessionsCount: pkg?.sessionsCount ?? '', sessionMins: pkg?.sessionMins ?? '120',
    features: (pkg?.features || []).join('\n'), cta: pkg?.cta || '', badge: pkg?.badge || '',
    featured: pkg?.featured || false, active: pkg ? pkg.active : true, order: pkg?.order ?? '',
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  const onName = (name) => {
    const sug = (p) => (slugify(p.name) ? `${p.skillBuildSlug || 'mentoring'}-${slugify(p.name)}` : '')
    setF((p) => ({ ...p, name, sku: !isNew || (p.sku && p.sku !== sug(p)) ? p.sku : sug({ ...p, name }) }))
  }

  const save = async () => {
    setBusy(true); setErr('')
    try {
      const body = {
        name: f.name, tagline: f.tagline,
        price: toPaise(f.priceInr),
        earlyBird: f.earlyBirdInr === '' ? null : toPaise(f.earlyBirdInr),
        sessionsCount: f.sessionsCount === '' ? null : Number(f.sessionsCount),
        sessionMins: f.sessionMins === '' ? null : Number(f.sessionMins),
        features: f.features.split('\n').map((s) => s.trim()).filter(Boolean),
        cta: f.cta || (isNew ? `Book ${f.name}` : undefined),
        badge: f.badge || null,
        featured: f.featured, active: f.active,
        order: f.order === '' ? 0 : Number(f.order),
      }
      if (isNew) {
        await api('/admin/packages', {
          method: 'POST', auth: 'admin',
          body: { ...body, skillBuildSlug: f.skillBuildSlug, sku: f.sku },
        })
      } else {
        await api(`/admin/packages/${pkg.id}`, { method: 'PATCH', auth: 'admin', body })
      }
      onSaved()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>{isNew ? 'New program' : `Edit ${pkg.name}`}</h2>
      <div className="adm-field">
        <label>Sub-category</label>
        <select className="adm-select" value={f.skillBuildSlug} disabled={!isNew}
                onChange={(e) => set('skillBuildSlug', e.target.value)}>
          {subcats.map((sc) => <option key={sc.slug} value={sc.slug}>{sc.name}</option>)}
        </select>
      </div>
      <div className="adm-row2">
        <div className="adm-field"><label>Name</label><input className="adm-input" value={f.name} onChange={(e) => onName(e.target.value)} placeholder="e.g. Bloom Plus" /></div>
        <div className="adm-field">
          <label>SKU {isNew ? '(unique — used by payments)' : '(fixed)'}</label>
          <input className="adm-input" value={f.sku} disabled={!isNew} onChange={(e) => set('sku', slugify(e.target.value))} />
        </div>
      </div>
      <div className="adm-row2">
        <div className="adm-field"><label>Price (₹, whole program)</label><input className="adm-input adm-num" type="number" value={f.priceInr} onChange={(e) => set('priceInr', e.target.value)} /></div>
        <div className="adm-field"><label>Early bird (₹, blank = none)</label><input className="adm-input adm-num" type="number" value={f.earlyBirdInr} onChange={(e) => set('earlyBirdInr', e.target.value)} /></div>
      </div>
      <div className="adm-row2">
        <div className="adm-field"><label>Sessions in the program</label><input className="adm-input adm-num" type="number" value={f.sessionsCount} onChange={(e) => set('sessionsCount', e.target.value)} placeholder="e.g. 5" /></div>
        <div className="adm-field"><label>Session length (mins)</label><input className="adm-input adm-num" type="number" value={f.sessionMins} onChange={(e) => set('sessionMins', e.target.value)} /></div>
      </div>
      <div className="adm-field"><label>Tagline</label><input className="adm-input" value={f.tagline} onChange={(e) => set('tagline', e.target.value)} /></div>
      <div className="adm-field"><label>Features (one per line)</label><textarea className="adm-textarea" rows={4} value={f.features} onChange={(e) => set('features', e.target.value)} /></div>
      <div className="adm-row2">
        <div className="adm-field"><label>Button text (blank = auto)</label><input className="adm-input" value={f.cta} onChange={(e) => set('cta', e.target.value)} /></div>
        <div className="adm-field"><label>Badge (blank = none)</label><input className="adm-input" value={f.badge} onChange={(e) => set('badge', e.target.value)} placeholder="e.g. Most Popular" /></div>
      </div>
      <div style={{ display: 'flex', gap: 18, margin: '4px 0 14px', fontSize: 14 }}>
        <label><input type="checkbox" checked={f.featured} onChange={(e) => set('featured', e.target.checked)} /> Featured</label>
        <label><input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} /> Active (bookable on site)</label>
      </div>
      {err && <p className="adm-error">{err}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="adm-btn" onClick={save}
                disabled={busy || !f.name || (isNew && !f.sku) || f.priceInr === '' || f.sessionsCount === ''}>
          {busy ? (isNew ? 'Creating…' : 'Saving…') : (isNew ? 'Create program' : 'Save changes')}
        </button>
        <button className="adm-btn adm-btn--ghost" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </div>
  )
}
