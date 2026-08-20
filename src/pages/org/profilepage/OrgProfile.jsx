import { useState } from 'react'
import { api } from '../../../api/client.js'
import { useOrg } from '../../../common_component/org/OrgContext/OrgContext.jsx'
import '../../admin/adminShared.css'

/**
 * The organisation's own profile — exactly what visitors see on /organisations,
 * plus the switch to be listed there at all.
 *
 * Deliberately NOT editable here: status, granted modules and the login email.
 * Those are admin's call, and the server ignores them on this endpoint even if
 * they're sent.
 */
export default function OrgProfile() {
  const { organisation, typeLabel, refresh } = useOrg()
  const [f, setF] = useState(() => ({
    name: organisation?.name || '',
    description: organisation?.description || '',
    branch: organisation?.branch || '',
    address: organisation?.address || '',
    city: organisation?.city || '',
    state: organisation?.state || '',
    pincode: organisation?.pincode || '',
    website: organisation?.website || '',
    contactPerson: organisation?.contactPerson || '',
    phone: organisation?.phone || '',
    publicListed: organisation?.publicListed !== false,
  }))
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setSaved(false) }

  if (!organisation) return null

  const save = async (e) => {
    e.preventDefault()
    setBusy(true); setError(''); setSaved(false)
    try {
      await api('/org/profile', { method: 'PATCH', auth: 'user', body: f })
      setSaved(true)
      refresh()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div>
      <h1 className="adm-title">Organisation</h1>
      <p className="adm-sub">
        This is what students and visitors see about you. Everything except the name is optional.
      </p>

      <form className="adm-panel" style={{ maxWidth: 720 }} onSubmit={save}>
        <div className="adm-row2">
          <div className="adm-field"><label>Organisation name</label>
            <input className="adm-input" value={f.name} onChange={(e) => set('name', e.target.value)} required maxLength={120} /></div>
          <div className="adm-field"><label>Type</label>
            <input className="adm-input" value={typeLabel} disabled />
            <span className="adm-sub" style={{ fontSize: 12 }}>Contact us to change your type.</span></div>
        </div>

        <div className="adm-field"><label>About (shown in the public directory)</label>
          <textarea className="adm-input" rows={4} value={f.description} maxLength={1200}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="e.g. A CBSE senior secondary school in east Delhi, running the Nirmaan scholarship for classes 9–12." />
          <span className="adm-sub" style={{ fontSize: 12 }}>{f.description.length}/1200</span></div>

        <div className="adm-row2">
          <div className="adm-field"><label>Branch / campus</label>
            <input className="adm-input" value={f.branch} onChange={(e) => set('branch', e.target.value)} maxLength={120} /></div>
          <div className="adm-field"><label>Website</label>
            <input className="adm-input" value={f.website} onChange={(e) => set('website', e.target.value)} maxLength={200} placeholder="https://…" /></div>
        </div>

        <div className="adm-field"><label>Address</label>
          <input className="adm-input" value={f.address} onChange={(e) => set('address', e.target.value)} maxLength={240} /></div>

        <div className="adm-row2">
          <div className="adm-field"><label>City</label>
            <input className="adm-input" value={f.city} onChange={(e) => set('city', e.target.value)} maxLength={80} /></div>
          <div className="adm-field"><label>State</label>
            <input className="adm-input" value={f.state} onChange={(e) => set('state', e.target.value)} maxLength={80} /></div>
        </div>

        <div className="adm-row2">
          <div className="adm-field"><label>Pincode</label>
            <input className="adm-input" value={f.pincode} onChange={(e) => set('pincode', e.target.value)} maxLength={12} /></div>
          <div className="adm-field"><label>Contact person</label>
            <input className="adm-input" value={f.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} maxLength={80} /></div>
        </div>

        <div className="adm-row2">
          <div className="adm-field"><label>Phone</label>
            <input className="adm-input" value={f.phone} onChange={(e) => set('phone', e.target.value)} maxLength={20} /></div>
          <div className="adm-field"><label>Login email</label>
            <input className="adm-input" value={organisation.email} disabled /></div>
        </div>

        <div className="adm-field">
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, textTransform: 'none' }}>
            <input type="checkbox" checked={f.publicListed} onChange={(e) => set('publicListed', e.target.checked)} />
            List us in the public partner directory
          </label>
          <span className="adm-sub" style={{ fontSize: 12 }}>
            Turn this off to stay private — your students can still enrol, you just won’t appear on /organisations.
          </span>
        </div>

        {error && <p className="adm-error">{error}</p>}

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="adm-btn" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
          {saved && <span className="adm-sub" style={{ margin: 0 }}>Saved ✓</span>}
        </div>
      </form>

      <section className="adm-panel" style={{ maxWidth: 720 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Your organisation code</h2>
        <p className="adm-sub" style={{ margin: 0 }}>
          <strong style={{ fontSize: 18, color: 'var(--navy)' }}>{organisation.code || '—'}</strong>
          <br />Share this with students so they can find you when enrolling themselves.
        </p>
      </section>
    </div>
  )
}
