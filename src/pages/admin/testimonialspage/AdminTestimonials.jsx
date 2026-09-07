import { useEffect, useState } from 'react'
import { api, apiUpload } from '../../../api/client.js'
import '../adminShared.css'

/**
 * Reviews — the quotes that appear on the home page, the Services cards, each
 * program page and Resources → Success Stories. Every one of those reads the
 * same list, so a review edited here changes everywhere at once.
 *
 * Two switches decide where a review shows up, and they are not the same thing:
 *   active   — off means it appears nowhere at all; the row stays here so it
 *              can be put back without retyping it.
 *   featured — the shorter list the home page and program pages lead with.
 */

const BLANK = { name: '', role: '', quote: '', photo: '', program: '', featured: false, active: true, order: '' }

function Form({ initial, isNew, onSave, onCancel, busy }) {
  const [f, setF] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const [pct, setPct] = useState(0)
  const [imgErr, setImgErr] = useState('')
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  const onPhoto = async (file) => {
    if (!file) return
    setImgErr(''); setUploading(true); setPct(0)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const { url } = await apiUpload('/admin/upload/image', fd, { auth: 'admin', onProgress: setPct })
      set('photo', url)
    } catch (e) { setImgErr(e.message) } finally { setUploading(false); setPct(0) }
  }

  return (
    <div style={{ background: 'var(--gray-50, #fafafa)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
      <h3 style={{ fontSize: 15, marginBottom: 12 }}>{isNew ? 'New review' : `Edit ${initial.name}`}</h3>
      <div className="adm-row2">
        <div className="adm-field"><label>Name</label>
          <input className="adm-input" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Who said it" />
        </div>
        <div className="adm-field"><label>Role (blank = none)</label>
          <input className="adm-input" value={f.role} onChange={(e) => set('role', e.target.value)} placeholder="e.g. Parent · Class 10" />
        </div>
      </div>
      {/* The photo is optional on purpose: the card drops the avatar and shows
          the name alone when there is none, so a review is never held back for
          want of a picture. */}
      <div className="adm-field">
        <label>Photo (optional) — paste a URL or upload</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {f.photo && !uploading && (
            <img
              src={f.photo}
              alt=""
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          )}
          <input className="adm-input" style={{ flex: 1, minWidth: 220 }} value={f.photo}
                 onChange={(e) => set('photo', e.target.value)} placeholder="https://…/photo.jpg" />
          <label className="adm-btn adm-btn--ghost" style={{ cursor: uploading ? 'default' : 'pointer', margin: 0, whiteSpace: 'nowrap' }}>
            {uploading ? 'Uploading…' : '⤒ Upload'}
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploading}
                   onChange={(e) => onPhoto(e.target.files?.[0])} />
          </label>
          {f.photo && !uploading && (
            <button type="button" className="adm-link" onClick={() => set('photo', '')}>Remove</button>
          )}
        </div>
        {uploading && (
          <div className="adm-progress">
            <div className="adm-progress-track"><span style={{ width: `${pct}%` }} /></div>
            <p className="adm-progress-label">Uploading… {pct}%</p>
          </div>
        )}
        {imgErr && <p className="adm-error">{imgErr}</p>}
      </div>

      <div className="adm-field"><label>The review</label>
        <textarea className="adm-textarea" rows={6} value={f.quote} onChange={(e) => set('quote', e.target.value)} />
      </div>
      <div className="adm-row2">
        <div className="adm-field"><label>Program (blank = none)</label>
          <select className="adm-input" value={f.program} onChange={(e) => set('program', e.target.value)}>
            <option value="">— not tied to a program —</option>
            <option value="bulls-eye">Bull's Eye</option>
            <option value="bloom">Bloom</option>
            <option value="breakthrough">Breakthrough</option>
            <option value="nirmaan">Nirmaan</option>
          </select>
        </div>
        <div className="adm-field"><label>Order (smaller shows first)</label>
          <input className="adm-input adm-num" type="number" value={f.order} onChange={(e) => set('order', e.target.value)} />
        </div>
      </div>
      <p className="adm-hint" style={{ marginTop: -8, marginBottom: 12, fontSize: 12, opacity: 0.75 }}>
        A program is only a filter: that program's own page leads with its own reviews and falls back to the rest.
      </p>
      <div style={{ display: 'flex', gap: 18, margin: '4px 0 14px', fontSize: 14 }}>
        <label><input type="checkbox" checked={f.featured} onChange={(e) => set('featured', e.target.checked)} /> Featured (home page + program pages)</label>
        <label><input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} /> Active (shows on the site)</label>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="adm-btn" onClick={() => onSave(f)} disabled={busy || !f.name.trim() || !f.quote.trim()}>
          {busy ? 'Saving…' : isNew ? 'Add review' : 'Save changes'}
        </button>
        <button className="adm-btn adm-btn--ghost" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </div>
  )
}

export default function AdminTestimonials() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [editing, setEditing] = useState(null) // id
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = () =>
    api('/admin/testimonials', { auth: 'admin' })
      .then((d) => setRows(d.testimonials))
      .catch((e) => setError(e.message))

  useEffect(() => { load() }, [])

  const done = async (text) => { setMsg(text); setEditing(null); setAdding(false); await load() }

  const save = async (f, id) => {
    setBusy(true); setError(''); setMsg('')
    const body = { ...f, order: f.order === '' ? undefined : Number(f.order) }
    try {
      if (id) await api(`/admin/testimonials/${id}`, { method: 'PATCH', auth: 'admin', body })
      else await api('/admin/testimonials', { method: 'POST', auth: 'admin', body })
      await done(`${f.name} ${id ? 'saved' : 'added'}`)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const toggle = async (t, key) => {
    setError(''); setMsg('')
    try {
      await api(`/admin/testimonials/${t.id}`, { method: 'PATCH', auth: 'admin', body: { [key]: !t[key] } })
      await load()
    } catch (e) { setError(e.message) }
  }

  // Deleting is the one thing that cannot be undone from here, so it says whose
  // review is going and offers the reversible option in the same breath.
  const remove = async (t) => {
    if (!confirm(`Delete ${t.name}'s review for good?\n\nThere is no undo. To take it off the site but keep it, switch Active off instead.`)) return
    setError(''); setMsg('')
    try {
      await api(`/admin/testimonials/${t.id}`, { method: 'DELETE', auth: 'admin' })
      setMsg(`${t.name}'s review deleted`)
      await load()
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="adm-page">
      <h1 className="adm-title">Reviews</h1>
      <p className="adm-sub">
        Shown on the home page, the Services cards, each program page and Resources → Success Stories.
        {rows && ` · ${rows.filter((r) => r.active).length} live of ${rows.length}`}
      </p>

      {!adding && !editing && (
        <button className="adm-btn" style={{ marginBottom: 14 }} onClick={() => setAdding(true)}>+ New review</button>
      )}
      {msg && <p className="adm-ok">{msg}</p>}
      {error && <p className="adm-error">{error}</p>}

      {adding && (
        <Form initial={BLANK} isNew busy={busy} onCancel={() => setAdding(false)} onSave={(f) => save(f)} />
      )}

      {rows == null && !error && <p className="adm-empty">Loading…</p>}
      {rows?.length === 0 && <p className="adm-empty">No reviews yet — add the first one.</p>}

      {rows?.map((t) => (
        <div key={t.id} className="adm-panel" style={{ padding: 14, marginBottom: 10 }}>
          {editing === t.id ? (
            <Form
              initial={{ name: t.name, role: t.role, quote: t.quote, photo: t.photo, program: t.program, featured: t.featured, active: t.active, order: t.order }}
              isNew={false}
              busy={busy}
              onCancel={() => setEditing(null)}
              onSave={(f) => save(f, t.id)}
            />
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', gap: 12 }}>
                {t.photo && (
                  <img src={t.photo} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: 2 }}
                       onError={(e) => { e.currentTarget.style.display = 'none' }} />
                )}
                <div style={{ minWidth: 0 }}>
                <strong style={{ fontSize: 15.5 }}>{t.name}</strong>
                {' '}<span className={`adm-badge adm-badge--${t.active ? 'ok' : 'muted'}`}>{t.active ? 'On the site' : 'Hidden'}</span>
                {t.featured && <span className="adm-badge adm-badge--warn" style={{ marginLeft: 6 }}>Featured</span>}
                {t.program && <span className="adm-badge adm-badge--muted" style={{ marginLeft: 6 }}>{t.program}</span>}
                {t.role && <p className="adm-sub" style={{ margin: '3px 0 0' }}>{t.role}</p>}
                <p style={{ margin: '6px 0 0', fontSize: 13.5, lineHeight: 1.55, color: 'var(--color-text-muted)' }}>{t.quote}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="adm-link" onClick={() => toggle(t, 'featured')}>{t.featured ? 'Unfeature' : 'Feature'}</button>
                <button className="adm-link" onClick={() => toggle(t, 'active')}>{t.active ? 'Hide' : 'Show'}</button>
                <button className="adm-link" onClick={() => setEditing(t.id)}>Edit</button>
                <button className="adm-link" style={{ color: 'var(--color-danger, #b3122b)' }} onClick={() => remove(t)}>Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
