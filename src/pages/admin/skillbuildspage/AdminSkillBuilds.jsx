import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../../api/client.js'
import '../adminShared.css'

/**
 * Skill Builds — the courses (level 2, e.g. Nirmaan) WITH their packages
 * (level 3, e.g. Discover/Clarity/Launch) nested inside each course card, so
 * the whole Skill Build side is managed in one place. Course videos live in
 * Content; mentoring programs in Mentoring → Programs.
 */
const toPaise = (r) => (r === '' || r == null ? null : Math.round(Number(r) * 100))
const slugify = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export default function AdminSkillBuilds() {
  const [builds, setBuilds] = useState(null) // courses
  const [packages, setPackages] = useState([]) // all course packages
  const [error, setError] = useState('')
  const [editingCourse, setEditingCourse] = useState(null) // slug
  const [editingPkg, setEditingPkg] = useState(null) // package id
  const [addingCourse, setAddingCourse] = useState(false)
  const [addingPkgFor, setAddingPkgFor] = useState(null) // course slug
  const [showRetired, setShowRetired] = useState(null) // course slug whose retired rows are open

  const load = () => {
    api('/admin/skill-builds', { auth: 'admin' }) // course-only
      .then((d) => setBuilds(d.skillBuilds || []))
      .catch((e) => setError(e.message))
    api('/admin/packages', { auth: 'admin' })
      .then((d) => setPackages(d.packages.filter((p) => (p.skillBuild?.kind || 'course') === 'course')))
      .catch(() => {})
  }

  useEffect(() => { load() }, [])

  const done = () => { setEditingCourse(null); setEditingPkg(null); setAddingCourse(false); setAddingPkgFor(null); load() }

  return (
    <div>
      <h1 className="adm-title">Skill Builds</h1>
      <p className="adm-sub">
        Courses and their packages, together. Course videos are managed in{' '}
        <Link to="/admin/content">Content</Link>; mentoring programs in{' '}
        <Link to="/admin/mentoring">Mentoring → Programs</Link>.
      </p>

      <div className="adm-toolbar">
        <button className="adm-btn adm-btn--sm" onClick={() => setAddingCourse(!addingCourse)}>+ New skill build</button>
      </div>

      {addingCourse && (
        <div className="adm-panel">
          <NewCourseForm onCancel={() => setAddingCourse(false)} onSaved={done} />
        </div>
      )}

      {error && <p className="adm-error">{error}</p>}
      {!builds && !error && <p className="adm-empty">Loading…</p>}

      {builds && builds.map((b) => {
        const all = packages.filter((p) => p.skillBuild?.slug === b.slug)
        // Rows that are on the site do the work; the rest are kept for a reason
        // that has nothing to do with selling — a retired plan a student still
        // owns, or the free trial — so they are folded away rather than mixed in.
        const pkgs = all.filter((p) => p.listed && p.active)
        const retired = all.filter((p) => !(p.listed && p.active))
        const rows = showRetired === b.slug ? [...pkgs, ...retired] : pkgs
        return (
          <div key={b.slug} className="adm-panel">
            {/* ---- course header ---- */}
            {editingCourse === b.slug ? (
              <CourseEditForm sb={b} onCancel={() => setEditingCourse(null)} onSaved={done} />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: 19 }}>
                    {b.name}
                    {' '}<span className={`adm-badge adm-badge--${b.active ? 'ok' : 'muted'}`}>{b.active ? 'Active' : 'Hidden'}</span>
                  </h2>
                  <p className="adm-sub" style={{ margin: '4px 0 0' }}>
                    {b.tagline || <span style={{ opacity: 0.6 }}>No tagline</span>}
                    {` · slug: ${b.slug}`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setEditingCourse(b.slug)}>Edit course</button>
                </div>
              </div>
            )}

            {/* ---- its packages ---- */}
            <div style={{ marginTop: 16, borderTop: '1px solid var(--gray-100, #eee)', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                  Packages ({pkgs.length})
                </h3>
                <button className="adm-btn adm-btn--ghost adm-btn--sm"
                        onClick={() => setAddingPkgFor(addingPkgFor === b.slug ? null : b.slug)}>
                  + Add package
                </button>
              </div>

              {addingPkgFor === b.slug && (
                <div style={{ background: 'var(--gray-50, #fafafa)', borderRadius: 10, padding: 14, marginBottom: 10 }}>
                  <NewPackageForm courseSlug={b.slug} onCancel={() => setAddingPkgFor(null)} onSaved={done} />
                </div>
              )}

              {pkgs.length === 0 && retired.length === 0 && addingPkgFor !== b.slug && (
                <p className="adm-empty">No packages yet — add the first one.</p>
              )}

              {rows.map((p) => (
                <div key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--gray-100, #f2f2f2)' }}>
                  {editingPkg === p.id ? (
                    <PackageEditForm pkg={p} onCancel={() => setEditingPkg(null)} onSaved={done} />
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div>
                        <strong style={{ fontSize: 15.5 }}>{p.name}</strong>
                        {/* A card only reaches the site when it is BOTH listed and
                            sellable, so the badge says so rather than reading
                            "On the site" for a plan nobody can see. */}
                        {' '}<span className={`adm-badge adm-badge--${p.listed && p.active ? 'ok' : 'muted'}`}>
                          {p.listed && p.active ? 'On the site' : 'Not on the site'}
                        </span>
                        {!p.active && <span className="adm-badge adm-badge--muted" style={{ marginLeft: 6 }}>Cannot be bought</span>}
                        {p.featured && <span className="adm-badge adm-badge--warn" style={{ marginLeft: 6 }}>Featured</span>}
                        {p.includesPsychometric && <span className="adm-badge adm-badge--muted" style={{ marginLeft: 6 }}>+ Test</span>}
                        {p.badge && <span className="adm-badge adm-badge--muted" style={{ marginLeft: 6 }}>{p.badge}</span>}
                        <p className="adm-sub" style={{ margin: '3px 0 0' }}>
                          {p.paymentMode === 'per-phase'
                            ? `₹${p.priceInr.toLocaleString('en-IN')} × ${p.phases} phases = ₹${(p.priceInr * p.phases).toLocaleString('en-IN')}`
                            : `₹${p.priceInr.toLocaleString('en-IN')}`}
                          {p.paymentMode !== 'per-phase' && p.earlyBirdInr != null && ` · pays ₹${p.earlyBirdInr.toLocaleString('en-IN')}`}
                          {p.modeLabel && ` · ${p.modeLabel}`}
                          {` · ${p.features.length} inclusion${p.features.length === 1 ? '' : 's'}`}
                          {` · ${(p.benefits || []).length} benefit${(p.benefits || []).length === 1 ? '' : 's'}`}
                          {` · SKU: ${p.sku}`}
                        </p>
                      </div>
                      <button className="adm-link" onClick={() => setEditingPkg(p.id)}>Edit</button>
                    </div>
                  )}
                </div>
              ))}

              {retired.length > 0 && (
                <button
                  className="adm-link"
                  style={{ marginTop: 10 }}
                  onClick={() => setShowRetired(showRetired === b.slug ? null : b.slug)}
                >
                  {showRetired === b.slug
                    ? 'Hide retired packages'
                    : `Show ${retired.length} retired package${retired.length === 1 ? '' : 's'}`}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ---------------- course forms ---------------- */

function CourseEditForm({ sb, onCancel, onSaved }) {
  const [f, setF] = useState({ name: sb.name, tagline: sb.tagline || '', order: sb.order, active: sb.active })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  const save = async () => {
    setBusy(true); setErr('')
    try {
      await api(`/admin/skill-builds/${sb.slug}`, {
        method: 'PATCH', auth: 'admin',
        body: { name: f.name, tagline: f.tagline, order: f.order === '' ? 0 : Number(f.order), active: f.active },
      })
      onSaved()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Edit {sb.name}</h2>
      <div className="adm-row2">
        <div className="adm-field"><label>Name</label><input className="adm-input" value={f.name} onChange={(e) => set('name', e.target.value)} /></div>
        <div className="adm-field"><label>Slug (fixed — payments &amp; URLs key off it)</label><input className="adm-input" value={sb.slug} disabled /></div>
      </div>
      <div className="adm-row2">
        <div className="adm-field"><label>Tagline</label><input className="adm-input" value={f.tagline} onChange={(e) => set('tagline', e.target.value)} /></div>
        <div className="adm-field"><label>Order</label><input className="adm-input adm-num" type="number" value={f.order} onChange={(e) => set('order', e.target.value)} /></div>
      </div>
      <div style={{ margin: '4px 0 14px', fontSize: 14 }}>
        <label><input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} /> Active (visible on site)</label>
      </div>
      {err && <p className="adm-error">{err}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="adm-btn" onClick={save} disabled={busy || !f.name.trim()}>{busy ? 'Saving…' : 'Save changes'}</button>
        <button className="adm-btn adm-btn--ghost" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </div>
  )
}

function NewCourseForm({ onCancel, onSaved }) {
  const [f, setF] = useState({ name: '', slug: '', tagline: '', order: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  const onName = (name) =>
    setF((p) => ({ ...p, name, slug: p.slug && p.slug !== slugify(p.name) ? p.slug : slugify(name) }))

  const save = async () => {
    setBusy(true); setErr('')
    try {
      await api('/admin/skill-builds', {
        method: 'POST', auth: 'admin',
        body: { name: f.name, slug: f.slug, kind: 'course', tagline: f.tagline, order: f.order === '' ? 0 : Number(f.order) },
      })
      onSaved()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>New skill build</h2>
      <p className="adm-sub" style={{ marginBottom: 12 }}>
        A new course — like Nirmaan. Add its packages right here after creating, and its sessions in Content.
      </p>
      <div className="adm-row2">
        <div className="adm-field"><label>Name</label><input className="adm-input" value={f.name} onChange={(e) => onName(e.target.value)} placeholder="e.g. Udaan" /></div>
        <div className="adm-field"><label>Slug (unique)</label><input className="adm-input" value={f.slug} onChange={(e) => set('slug', slugify(e.target.value))} /></div>
      </div>
      <div className="adm-row2">
        <div className="adm-field"><label>Tagline</label><input className="adm-input" value={f.tagline} onChange={(e) => set('tagline', e.target.value)} /></div>
        <div className="adm-field"><label>Order</label><input className="adm-input adm-num" type="number" value={f.order} onChange={(e) => set('order', e.target.value)} /></div>
      </div>
      {err && <p className="adm-error">{err}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="adm-btn" onClick={save} disabled={busy || !f.name || !f.slug}>
          {busy ? 'Creating…' : 'Create skill build'}
        </button>
        <button className="adm-btn adm-btn--ghost" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </div>
  )
}

/* ---------------- package forms (shared field set) ---------------- */

function PackageFields({ f, set, isNew }) {
  return (
    <>
      <div className="adm-row2">
        <div className="adm-field"><label>Name (tier)</label><input className="adm-input" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Clarity" /></div>
        <div className="adm-field">
          <label>SKU {isNew ? '(unique — used by payments)' : '(fixed)'}</label>
          <input className="adm-input" value={f.sku} disabled={!isNew} onChange={(e) => set('sku', slugify(e.target.value))} />
        </div>
      </div>
      <div className="adm-row2">
        <div className="adm-field"><label>Price (₹)</label><input className="adm-input adm-num" type="number" value={f.priceInr} onChange={(e) => set('priceInr', e.target.value)} /></div>
        <div className="adm-field"><label>Early bird (₹, blank = none)</label><input className="adm-input adm-num" type="number" value={f.earlyBirdInr} onChange={(e) => set('earlyBirdInr', e.target.value)} /></div>
      </div>
      <div className="adm-row2">
        <div className="adm-field"><label>Period label</label><input className="adm-input" value={f.period} onChange={(e) => set('period', e.target.value)} placeholder="one-time / 6 months" /></div>
        <div className="adm-field"><label>Access days (blank = one-time)</label><input className="adm-input adm-num" type="number" value={f.durationDays} onChange={(e) => set('durationDays', e.target.value)} /></div>
      </div>
      <div className="adm-row2">
        <div className="adm-field">
          <label>How it is paid</label>
          <select className="adm-input" value={f.paymentMode} onChange={(e) => set('paymentMode', e.target.value)}>
            <option value="one-time">Pay once — the whole course opens</option>
            <option value="per-phase">Pay as you use — one phase per payment</option>
          </select>
        </div>
        <div className="adm-field">
          <label>Phases the course is cut into</label>
          <input className="adm-input adm-num" type="number" min="1" value={f.phases} onChange={(e) => set('phases', e.target.value)} />
        </div>
      </div>
      <p className="adm-hint" style={{ marginTop: -8, marginBottom: 12, fontSize: 12, opacity: 0.75 }}>
        {f.paymentMode === 'per-phase'
          ? `Price above is ONE instalment. The card will read "x ${f.phases || 1}" and show the full run.`
          : 'Price above is the whole course. Paying once opens every phase immediately.'}
      </p>
      <div className="adm-row2">
        <div className="adm-field">
          <label>Payment-mode label (the toggle on the site)</label>
          <input className="adm-input" value={f.modeLabel} onChange={(e) => set('modeLabel', e.target.value)} placeholder="Pay Once / Pay As You Use" />
        </div>
        <div className="adm-field">
          <label>Price note (green line under the costs)</label>
          <input className="adm-input" value={f.priceNote} onChange={(e) => set('priceNote', e.target.value)} placeholder="e.g. Flat 25% Discount" />
        </div>
      </div>
      <div className="adm-field"><label>Tagline</label><input className="adm-input" value={f.tagline} onChange={(e) => set('tagline', e.target.value)} /></div>
      <div className="adm-field"><label>Inclusions — what the plan includes (one per line)</label><textarea className="adm-textarea" rows={5} value={f.features} onChange={(e) => set('features', e.target.value)} /></div>
      <div className="adm-field"><label>Benefits — what the student gets out of it (one per line)</label><textarea className="adm-textarea" rows={4} value={f.benefits} onChange={(e) => set('benefits', e.target.value)} /></div>
      <div className="adm-row2">
        <div className="adm-field"><label>Button text {isNew ? '(blank = auto)' : ''}</label><input className="adm-input" value={f.cta} onChange={(e) => set('cta', e.target.value)} /></div>
        <div className="adm-field"><label>Badge (blank = none)</label><input className="adm-input" value={f.badge} onChange={(e) => set('badge', e.target.value)} placeholder="e.g. Most Popular" /></div>
      </div>
      <div style={{ display: 'flex', gap: 18, margin: '4px 0 6px', fontSize: 14, flexWrap: 'wrap' }}>
        <label><input type="checkbox" checked={f.includesPsychometric} onChange={(e) => set('includesPsychometric', e.target.checked)} /> Includes the psychometric test</label>
        <label><input type="checkbox" checked={f.featured} onChange={(e) => set('featured', e.target.checked)} /> Featured (highlighted card)</label>
        <label><input type="checkbox" checked={f.listed} onChange={(e) => set('listed', e.target.checked)} /> Listed (a card shows on the site)</label>
        <label><input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} /> Active (can be bought)</label>
      </div>
      {/* Retiring a plan is 'listed' off, NOT 'active' off: payments looks a
          student's tier up by sku, so switching a plan they own to inactive
          also takes away the upgrade credit they paid for. */}
      <p className="adm-hint" style={{ margin: '0 0 14px', fontSize: 12, opacity: 0.75 }}>
        To retire a plan, untick <strong>Listed</strong> and leave <strong>Active</strong> on — the card
        disappears from the site while students who already bought it keep their access and upgrade credit.
      </p>
    </>
  )
}

const lines = (t) => String(t || '').split('\n').map((s) => s.trim()).filter(Boolean)
const pkgBody = (f) => ({
  name: f.name, tagline: f.tagline,
  price: toPaise(f.priceInr),
  earlyBird: f.earlyBirdInr === '' ? null : toPaise(f.earlyBirdInr),
  period: f.period,
  durationDays: f.durationDays === '' ? null : Number(f.durationDays),
  features: lines(f.features),
  benefits: lines(f.benefits),
  modeLabel: f.modeLabel, priceNote: f.priceNote,
  paymentMode: f.paymentMode,
  phases: Math.max(1, Number(f.phases) || 1),
  includesPsychometric: !!f.includesPsychometric,
  badge: f.badge || null, featured: f.featured, active: f.active, listed: f.listed,
})

function PackageEditForm({ pkg, onCancel, onSaved }) {
  const [f, setF] = useState({
    name: pkg.name, sku: pkg.sku, tagline: pkg.tagline || '',
    priceInr: pkg.priceInr, earlyBirdInr: pkg.earlyBirdInr ?? '',
    period: pkg.period, durationDays: pkg.durationDays ?? '',
    features: (pkg.features || []).join('\n'), benefits: (pkg.benefits || []).join('\n'),
    modeLabel: pkg.modeLabel || '', priceNote: pkg.priceNote || '',
    paymentMode: pkg.paymentMode || 'one-time', phases: pkg.phases ?? 1,
    includesPsychometric: !!pkg.includesPsychometric,
    cta: pkg.cta, badge: pkg.badge || '',
    featured: pkg.featured, active: pkg.active, listed: pkg.listed !== false,
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  const save = async () => {
    setBusy(true); setErr('')
    try {
      await api(`/admin/packages/${pkg.id}`, {
        method: 'PATCH', auth: 'admin',
        body: { ...pkgBody(f), cta: f.cta },
      })
      onSaved()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div style={{ background: 'var(--gray-50, #fafafa)', borderRadius: 10, padding: 14 }}>
      <h3 style={{ fontSize: 15, marginBottom: 12 }}>Edit {pkg.name}</h3>
      <PackageFields f={f} set={set} isNew={false} />
      {err && <p className="adm-error">{err}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="adm-btn" onClick={save} disabled={busy || !f.name}>{busy ? 'Saving…' : 'Save changes'}</button>
        <button className="adm-btn adm-btn--ghost" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </div>
  )
}

function NewPackageForm({ courseSlug, onCancel, onSaved }) {
  const [f, setF] = useState({
    name: '', sku: '', tagline: '',
    priceInr: '', earlyBirdInr: '', period: 'one-time', durationDays: '',
    features: '', benefits: '', modeLabel: '', priceNote: '',
    paymentMode: 'one-time', phases: 1, includesPsychometric: false,
    cta: '', badge: '', featured: false, active: true, listed: true,
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // Auto-suggest the SKU from course + name (editable until saved).
  const suggested = (p) => (slugify(p.name) ? `${courseSlug}-${slugify(p.name)}` : '')
  const set = (k, v) =>
    setF((p) => {
      const next = { ...p, [k]: v }
      if (k === 'name' && (!p.sku || p.sku === suggested(p))) next.sku = suggested(next)
      return next
    })

  const save = async () => {
    setBusy(true); setErr('')
    try {
      await api('/admin/packages', {
        method: 'POST', auth: 'admin',
        body: { ...pkgBody(f), skillBuildSlug: courseSlug, sku: f.sku, cta: f.cta || 'Buy now' },
      })
      onSaved()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, marginBottom: 12 }}>New package</h3>
      <PackageFields f={f} set={set} isNew />
      {err && <p className="adm-error">{err}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="adm-btn" onClick={save} disabled={busy || !f.name || !f.sku || f.priceInr === ''}>
          {busy ? 'Creating…' : 'Create package'}
        </button>
        <button className="adm-btn adm-btn--ghost" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </div>
  )
}
