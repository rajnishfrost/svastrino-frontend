import { useEffect, useState } from 'react'
import { api } from '../../../api/client.js'
import '../adminShared.css'

// Coupon endpoints live under the payments admin module.
export default function AdminCoupons() {
  const [coupons, setCoupons] = useState(null)
  const [error, setError] = useState('')
  const [f, setF] = useState({ code: '', type: 'percent', value: '', maxRedemptions: '', expiresAt: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () =>
    api('/admin/payments/coupons', { auth: 'admin' })
      .then((d) => setCoupons(d.coupons))
      .catch((e) => setError(e.message))

  useEffect(() => { load() }, [])

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  const create = async (e) => {
    e.preventDefault()
    setBusy(true); setError(''); setMsg('')
    try {
      await api('/admin/payments/coupons', {
        method: 'POST', auth: 'admin',
        body: {
          code: f.code.trim().toUpperCase(),
          type: f.type,
          // percent → whole number; flat → paise
          value: f.type === 'percent' ? Number(f.value) : Math.round(Number(f.value) * 100),
          maxRedemptions: f.maxRedemptions ? Number(f.maxRedemptions) : null,
          expiresAt: f.expiresAt || null,
        },
      })
      setMsg(`Coupon ${f.code.toUpperCase()} created`)
      setF({ code: '', type: 'percent', value: '', maxRedemptions: '', expiresAt: '' })
      load()
    } catch (e2) { setError(e2.message) } finally { setBusy(false) }
  }

  return (
    <div>
      <h1 className="adm-title">Coupons</h1>
      <p className="adm-sub">Create discount codes. Percent = %, Flat = ₹ off.</p>

      <div className="adm-panel">
        <form onSubmit={create}>
          <div className="adm-row2">
            <div className="adm-field"><label>Code</label><input className="adm-input" value={f.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="WELCOME10" required /></div>
            <div className="adm-field"><label>Type</label>
              <select className="adm-select" value={f.type} onChange={(e) => set('type', e.target.value)}>
                <option value="percent">Percent (%)</option><option value="flat">Flat (₹)</option>
              </select></div>
          </div>
          <div className="adm-row2">
            <div className="adm-field"><label>{f.type === 'percent' ? 'Discount (%)' : 'Discount (₹)'}</label><input className="adm-input adm-num" type="number" value={f.value} onChange={(e) => set('value', e.target.value)} required /></div>
            <div className="adm-field"><label>Max redemptions (blank = unlimited)</label><input className="adm-input adm-num" type="number" value={f.maxRedemptions} onChange={(e) => set('maxRedemptions', e.target.value)} /></div>
          </div>
          <div className="adm-field" style={{ maxWidth: 260 }}><label>Expires (blank = never)</label><input className="adm-input" type="date" value={f.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} /></div>
          {error && <p className="adm-error">{error}</p>}
          {msg && <p className="adm-ok">{msg}</p>}
          <button className="adm-btn" disabled={busy}>{busy ? 'Creating…' : 'Create coupon'}</button>
        </form>
      </div>

      {!coupons ? <p className="adm-empty">Loading…</p> : coupons.length === 0 ? (
        <p className="adm-empty">No coupons yet.</p>
      ) : (
        <div className="adm-panel adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Code</th><th>Discount</th><th>Used</th><th>Expires</th><th>Status</th></tr></thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id}>
                  <td><strong>{c.code}</strong></td>
                  <td>{c.type === 'percent' ? `${c.value}%` : `₹${(c.value / 100).toLocaleString('en-IN')}`}</td>
                  <td className="adm-num">{c.redemptions}{c.maxRedemptions ? ` / ${c.maxRedemptions}` : ''}</td>
                  <td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : '—'}</td>
                  <td><span className={`adm-badge adm-badge--${c.active ? 'ok' : 'muted'}`}>{c.active ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
