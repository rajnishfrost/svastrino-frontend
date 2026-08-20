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
    if (upg.currentPackage.packageId === pkg.sku) {
      // On a pay-as-you-use plan the same card is how you buy the NEXT phase.
      const ph = upg.phase
      if (ph?.paymentMode === 'per-phase') {
        return ph.nextPhase
          ? { kind: 'next-phase', phase: ph.nextPhase, total: ph.total, amount: ph.amount }
          : { kind: 'all-paid' }
      }
      return { kind: 'current' }
    }
    // A pay-as-you-use student cannot switch plans mid-course.
    if (upg.phase?.paymentMode === 'per-phase') return { kind: 'locked-payu' }
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
                  {/* Pay-once plans show the discounted price with the list price
                      struck through; pay-as-you-use shows the instalment and the
                      full run underneath. */}
                  {pkg.earlyBird ? (
                    <>
                      {pkg.earlyBird} <span>{pkg.period}</span>
                      <em>
                        <s>{pkg.price}</s>
                        {pkg.savingPercent ? ` · save ${pkg.savingPercent}%` : ''}
                      </em>
                    </>
                  ) : (
                    <>
                      {pkg.price} <span>{pkg.period}</span>
                      {pkg.totalPrice && (
                        <em>{pkg.phases} phases · {pkg.totalPrice} in total</em>
                      )}
                    </>
                  )}
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
                  if (cta.kind === 'next-phase')
                    return (
                      <Link to={`/checkout?pkg=${pkg.sku}`} className="btn btn-primary">
                        Pay for phase {cta.phase} of {cta.total} · {inr(cta.amount)}
                      </Link>
                    )
                  if (cta.kind === 'all-paid')
                    return <button className="btn btn-secondary nirmaan-pkg-cta-disabled" disabled>All phases paid</button>
                  if (cta.kind === 'locked-payu')
                    return <button className="btn btn-secondary nirmaan-pkg-cta-disabled" disabled>Continue your current plan</button>
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
