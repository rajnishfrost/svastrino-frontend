import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../../../api/client.js'
import { useAuth } from '../../../../context/AuthContext.jsx'

/**
 * Pricing tiers — fetched from the backend Skill-Build catalog
 * (GET /user/skill-build/nirmaan → { skillBuild, packages }). Prices, features
 * and copy all live in the DB (packages collection), not the client.
 *
 * Two of the plans bundle the psychometric test, which is written for classes
 * 7 to 12 and sold to nobody outside that band. Checkout refuses the payment
 * either way; these cards say the rule out loud first, so nobody meets it for
 * the first time with their card details already typed in.
 */
const inr = (paise) => '₹' + (Math.round(Number(paise) || 0) / 100).toLocaleString('en-IN')

// The band the test is written and scored for (2026 plans sheet).
const PSY_MIN_CLASS = 7
const PSY_MAX_CLASS = 12

/**
 * The class number hiding in a profile's free-text class, or null when there is
 * nothing usable there. Students write 'Class 9', '9', '10th' and everything in
 * between, so take the first standalone one- or two-digit number; a longer run
 * of digits is a year or a phone number, never a class. The server reads the
 * field the same way at checkout, so the card and the payment step agree.
 */
const classNumber = (raw) => {
  const match = String(raw || '').match(/(^|\D)(\d{1,2})(\D|$)/)
  if (!match) return null
  const n = Number(match[2])
  return n > 0 ? n : null
}

export default function Packages() {
  const { user } = useAuth()
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

  // We only judge a visitor we actually know something about. An account with
  // no class on it gets the plain eligibility line and nothing else — guessing
  // at someone's class and turning them away would be worse than saying less.
  const myClass = classNumber(user?.studentClass)
  const outOfBand = myClass != null && (myClass < PSY_MIN_CLASS || myClass > PSY_MAX_CLASS)

  // Every plan with the test has a twin without it on the same payment terms.
  // Naming that twin turns "you cannot buy this" into "buy this one instead".
  const twinWithoutTest = (pkg) =>
    (packages || []).find((p) => !p.includesPsychometric && p.paymentMode === pkg.paymentMode)

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
                {/* Sits between the features and the button on purpose: it is the
                    last thing read before the click that starts a payment. */}
                {pkg.includesPsychometric && (
                  <div className="nirmaan-pkg-psy">
                    <p className="nirmaan-pkg-psy-rule">
                      Psychometric testing is for students in classes {PSY_MIN_CLASS} to {PSY_MAX_CLASS}.
                    </p>
                    {outOfBand && (
                      <p className="nirmaan-pkg-psy-you">
                        Your profile says class {myClass}. The test is not offered for that
                        class, so this plan is not the one for you.{' '}
                        {twinWithoutTest(pkg)
                          ? `Take ${twinWithoutTest(pkg).name} instead — same course, same terms, without the test.`
                          : 'Please pick one of the plans without the test.'}
                      </p>
                    )}
                  </div>
                )}
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

        {/* Half the plans on this page cost more because of a test most parents
            have never taken. It is worth the space to say what they are buying. */}
        {packages && packages.some((p) => p.includesPsychometric) && (
          <div className="nirmaan-psy-about">
            <h3>About the psychometric test</h3>
            <p>
              Some of the plans above include a psychometric test. It is a set of simple
              questions about what you enjoy, what comes easily to you and how you like to
              work. There is no pass or fail, and no studying for it.
            </p>
            <ul>
              <li>
                It is scored on the RIASEC scale, which sorts what interests a student into
                six broad types.
              </li>
              <li>
                You get a report of up to 40 pages — strengths, weaker areas, personality,
                interests and preferences, in plain language.
              </li>
              <li>The report names the top 5 careers that suit the student best.</li>
              <li>The test is for students in classes {PSY_MIN_CLASS} to {PSY_MAX_CLASS}.</li>
            </ul>
            <Link to="/skill-build/psychometric-testing" className="nirmaan-psy-about-more">
              Read more about the test →
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
