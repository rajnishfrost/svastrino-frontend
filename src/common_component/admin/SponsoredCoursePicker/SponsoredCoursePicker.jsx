import { useEffect, useState } from 'react'
import { api } from '../../../api/client.js'

/**
 * Which Skill-Build courses an organisation sponsors for every student it
 * adds. Shared by the New-account form (Users page) and the organisation's
 * access modal (Organisations page) so the two never offer different lists.
 *
 * Only live course packages are offered: mentoring programs are a different
 * product, and the free trial (price 0, inactive) is not something anyone can
 * sponsor. The grant itself happens on the server when the student claims the
 * account — the note says so, because "enrols students" on its own reads as
 * "the moment I import the roster", which is exactly what it does not do.
 */
export default function SponsoredCoursePicker({ value = [], onChange }) {
  const [catalog, setCatalog] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/admin/packages', { auth: 'admin' }) // manage routes mount at /admin root
      .then((d) => setCatalog(
        (d.packages || []).filter((p) =>
          (p.skillBuild?.kind || 'course') !== 'mentoring' && p.active !== false && p.price > 0)
      ))
      .catch((e) => { setError(e.message); setCatalog([]) })
  }, [])

  // One course at a time — the same rule a student lives under (one package
  // per product), so the value is still a list, but never longer than one.
  const chosen = value[0] || ''
  const pick = (sku) => onChange(sku ? [sku] : [])

  return (
    <div className="adm-field">
      <label>Sponsored Skill-Build course</label>
      <p className="adm-sub" style={{ margin: '0 0 8px' }}>
        Every student this organisation adds gets the chosen course — one course only — granted the
        moment they set their password from the invite (or first sign in with Google), not when the
        roster is imported.
      </p>
      {error && <p className="adm-error">{error}</p>}
      {!catalog ? (
        <p className="adm-sub" style={{ margin: 0 }}>Loading courses…</p>
      ) : catalog.length === 0 ? (
        <p className="adm-sub" style={{ margin: 0 }}>No live course packages to offer.</p>
      ) : (
        <>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, fontSize: 14 }}>
            <input type="radio" name="sponsored-course" checked={!chosen} onChange={() => pick('')} />
            <span>No sponsored course</span>
          </label>
          {catalog.map((p) => (
        <label key={p.sku} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8, fontSize: 14 }}>
          <input type="radio" name="sponsored-course" checked={chosen === p.sku} onChange={() => pick(p.sku)} style={{ marginTop: 3 }} />
          <span>
            <strong>{p.name}</strong>
            {p.skillBuild?.name && !p.name.startsWith(p.skillBuild.name) ? ` · ${p.skillBuild.name}` : ''}
            {/* Two plans can share a name and differ only in how they are paid
                for — a per-phase price is not the price of the course, and a
                sponsor is paying for the whole of it. Say which is which. */}
            <div className="adm-sub" style={{ margin: 0 }}>
              {p.paymentMode === 'per-phase'
                ? `Pay as you use · ₹${p.earlyBirdInr ?? p.priceInr} per phase × ${p.phases || 1} phases (sponsor opens all)`
                : `Pay once · ₹${p.earlyBirdInr ?? p.priceInr}`}
              {p.durationDays ? ` · ${p.durationDays} days access from the day the student claims the account` : ''}
            </div>
          </span>
        </label>
          ))}
        </>
      )}
    </div>
  )
}
