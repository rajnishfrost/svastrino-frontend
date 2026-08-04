import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../../../api/client.js'

/**
 * Pricing tiers — fetched from the backend Skill-Build catalog
 * (GET /user/skill-build/nirmaan → { skillBuild, packages }). Prices, features
 * and copy all live in the DB (packages collection), not the client.
 */
const inr = (paise) => '₹' + (Math.round(Number(paise) || 0) / 100).toLocaleString('en-IN')

export default function Packages() {
  const [packages, setPackages] = useState(null)
  const [error, setError] = useState('')
  const [upg, setUpg] = useState(null) // enrolled user's upgrade status (null = not enrolled / logged out)

  useEffect(() => {
    api('/user/skill-build/nirmaan')
      .then((d) => setPackages(d.packages || []))
      .catch((e) => setError(e.message))
    // Best-effort: if signed in and enrolled, tailor each card's CTA.
    api('/user/payments/upgrade-status?product=nirmaan', { auth: 'user' })
      .then((u) => setUpg(u?.hasEnrollment ? u : null))
      .catch(() => setUpg(null))
  }, [])

  // What the CTA should do for a given package, given the user's enrollment.
  const ctaFor = (pkg) => {
    if (!upg) return { kind: 'buy' }
    if (upg.currentPackage.packageId === pkg.sku) return { kind: 'current' }
    const opt = upg.options.find((o) => o.packageId === pkg.sku)
    if (opt) return upg.withinWindow ? { kind: 'upgrade', amount: opt.amount } : { kind: 'closed' }
    return { kind: 'owned' } // a lower tier than the one they already own
  }

  return (
    <section id="packages" className="section section--alt">
      <div className="container text-center">
        <p className="section-eyebrow">Packages</p>
        <h2 className="section-title">Choose your journey</h2>
        <p className="section-sub">Every student is different. Pick the depth of support that fits.</p>

        {error && <p className="section-sub">Couldn’t load packages. Please try again later.</p>}
        {packages == null && !error && <p className="section-sub">Loading packages…</p>}

        {packages && packages.length > 0 && (
          <div className="grid grid-3 nirmaan-pkgs">
            {packages.map((pkg) => (
              <div key={pkg.id} className={`card nirmaan-pkg${pkg.featured ? ' featured' : ''}`}>
                {pkg.badge && <span className="nirmaan-pkg-badge">{pkg.badge}</span>}
                <div className="nirmaan-pkg-name">{pkg.name}</div>
                <p className="nirmaan-pkg-tagline">{pkg.tagline}</p>
                <div className="nirmaan-pkg-price">
                  {pkg.price} <span>{pkg.period}</span>
                  {pkg.earlyBird && <em>early bird {pkg.earlyBird}</em>}
                </div>
                <ul className="nirmaan-pkg-list">
                  {pkg.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                {(() => {
                  const cta = ctaFor(pkg)
                  if (cta.kind === 'current')
                    return <button className="btn btn-secondary nirmaan-pkg-cta-disabled" disabled>Current plan</button>
                  if (cta.kind === 'upgrade')
                    return <Link to={`/checkout?pkg=${pkg.sku}`} className="btn btn-primary">Upgrade · pay {inr(cta.amount)}</Link>
                  if (cta.kind === 'closed')
                    return <button className="btn btn-secondary nirmaan-pkg-cta-disabled" disabled>Upgrade window closed</button>
                  if (cta.kind === 'owned')
                    return <button className="btn btn-secondary nirmaan-pkg-cta-disabled" disabled>Included in your plan</button>
                  return <Link to={`/checkout?pkg=${pkg.sku}`} className={`btn ${pkg.variant}`}>{pkg.cta}</Link>
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
