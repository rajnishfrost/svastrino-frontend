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
        const pkgs = packages.filter((p) => p.skillBuild?.slug === b.slug)
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

              {pkgs.length === 0 && addingPkgFor !== b.slug && (
                <p className="adm-empty">No packages yet — add the first one.</p>
              )}

              {pkgs.map((p) => (
                <div key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--gray-100, #f2f2f2)' }}>
                  {editingPkg === p.id ? (
                    <PackageEditForm pkg={p} onCancel={() => setEditingPkg(null)} onSaved={done} />
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div>
                        <strong style={{ fontSize: 15.5 }}>{p.name}</strong>
                        {' '}<span className={`adm-badge adm-badge--${p.active ? 'ok' : 'muted'}`}>{p.active ? 'Active' : 'Hidden'}</span>
                        {p.featured && <span className="adm-badge adm-badge--warn" style={{ marginLeft: 6 }}>Featured</span>}
                        {p.badge && <span className="adm-badge adm-badge--muted" style={{ marginLeft: 6 }}>{p.badge}</span>}
                        <p className="adm-sub" style={{ margin: '3px 0 0' }}>
                          ₹{p.priceInr.toLocaleString('en-IN')}
                          {p.earlyBirdInr != null && ` · early bird ₹${p.earlyBirdInr.toLocaleString('en-IN')}`}
                          {` · ${p.period}`}
                          {` · ${p.features.length} feature${p.features.length === 1 ? '' : 's'}`}
                          {` · SKU: ${p.sku}`}
                        </p>
                      </div>
                      <button className="adm-link" onClick={() => setEditingPkg(p.id)}>Edit</button>
                    </div>
                  )}
                </div>
              ))}
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
      <div className="adm-field"><label>Tagline</label><input className="adm-input" value={f.tagline} onChange={(e) => set('tagline', e.target.value)} /></div>
      <div className="adm-field"><label>Features (one per line)</label><textarea className="adm-textarea" rows={4} value={f.features} onChange={(e) => set('features', e.target.value)} /></div>
      <div className="adm-row2">
        <div className="adm-field"><label>Button text {isNew ? '(blank = auto)' : ''}</label><input className="adm-input" value={f.cta} onChange={(e) => set('cta', e.target.value)} /></div>
        <div className="adm-field"><label>Badge (blank = none)</label><input className="adm-input" value={f.badge} onChange={(e) => set('badge', e.target.value)} placeholder="e.g. Most Popular" /></div>
      </div>
      <div style={{ display: 'flex', gap: 18, margin: '4px 0 14px', fontSize: 14 }}>
        <label><input type="checkbox" checked={f.featured} onChange={(e) => set('featured', e.target.checked)} /> Featured</label>
        <label><input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} /> Active (visible on site)</label>
      </div>
    </>
  )
}

const pkgBody = (f) => ({
  name: f.name, tagline: f.tagline,
  price: toPaise(f.priceInr),
  earlyBird: f.earlyBirdInr === '' ? null : toPaise(f.earlyBirdInr),
  period: f.period,
  durationDays: f.durationDays === '' ? null : Number(f.durationDays),
  features: f.features.split('\n').map((s) => s.trim()).filter(Boolean),
  badge: f.badge || null, featured: f.featured, active: f.active,
})

function PackageEditForm({ pkg, onCancel, onSaved }) {
  const [f, setF] = useState({
    name: pkg.name, sku: pkg.sku, tagline: pkg.tagline || '',
    priceInr: pkg.priceInr, earlyBirdInr: pkg.earlyBirdInr ?? '',
    period: pkg.period, durationDays: pkg.durationDays ?? '',
    features: pkg.features.join('\n'), cta: pkg.cta, badge: pkg.badge || '',
    featured: pkg.featured, active: pkg.active,
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
    features: '', cta: '', badge: '', featured: false, active: true,
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
