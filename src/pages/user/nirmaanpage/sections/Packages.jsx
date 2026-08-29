import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { api } from '../../../../api/client.js'
import { useAuth } from '../../../../context/AuthContext.jsx'

/**
 * Pricing — fetched from the backend Skill-Build catalog
 * (GET /user/skill-build/nirmaan → { skillBuild, packages }). Prices, features
 * and copy all live in the DB (packages collection), not the client.
 *
 * The catalog ships four packages that are really TWO axes:
 *   • plan            — Nirmaan  vs  Nirmaan + Psychometric Testing  (includesPsychometric)
 *   • payment struct. — Pay once vs  Pay as you go                    (paymentMode)
 * So instead of four cards we show a payment-mode TOGGLE and, under it, the two
 * plan cards for the selected mode. Everything is derived from the package
 * fields, so adding/removing a package or a mode in the DB just works.
 *
 * Two of the plans bundle the psychometric test, which is written for classes
 * 7 to 12 and sold to nobody outside that band. The card says the rule out loud
 * first, so nobody meets it for the first time with their card details typed in.
 */
const inr = (paise) => '₹' + (Math.round(Number(paise) || 0) / 100).toLocaleString('en-IN')

// The band the test is written and scored for (2026 plans sheet).
const PSY_MIN_CLASS = 7
const PSY_MAX_CLASS = 12

// Human labels + display order for the payment-mode toggle. Any mode the DB
// returns that isn't listed here still shows, appended after these.
const MODE_LABELS = { 'one-time': 'Pay once', 'per-phase': 'Pay as you go' }
const MODE_ORDER = ['one-time', 'per-phase']

// A steady card title per plan, regardless of the package's mode-specific name
// (e.g. "Nirmaan (Pay as you Use)").
const planName = (pkg) => (pkg.includesPsychometric ? 'Nirmaan + Psychometric Testing' : 'Nirmaan')

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

// --- shared Tailwind button styles (Nirmaan green) ---
const BTN_PRIMARY =
  'mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border-0 bg-nirmaan-green px-5 text-sm font-semibold text-white transition-colors hover:bg-nirmaan-green-dark'
const BTN_OUTLINE =
  'mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-nirmaan-green/40 bg-white px-5 text-sm font-semibold text-nirmaan-green transition-colors hover:bg-nirmaan-green hover:text-white'
const BTN_DISABLED =
  'mt-6 inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-lg border border-nirmaan-sand bg-white px-5 text-sm font-semibold text-nirmaan-brown-soft'

export default function Packages() {
  const { user } = useAuth()
  const [packages, setPackages] = useState(null)
  const [error, setError] = useState('')
  const [upg, setUpg] = useState(null) // enrolled user's upgrade status (null = not enrolled / logged out)
  const [mode, setMode] = useState(null) // selected paymentMode (null → first available)

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
  // no class on it gets the plain eligibility line and nothing else.
  const myClass = classNumber(user?.studentClass)
  const outOfBand = myClass != null && (myClass < PSY_MIN_CLASS || myClass > PSY_MAX_CLASS)

  // ---- Derive the two axes from the package list ----
  const all = packages || []
  const presentModes = [...new Set(all.map((p) => p.paymentMode || 'one-time'))]
  const modes = [
    ...MODE_ORDER.filter((m) => presentModes.includes(m)),
    ...presentModes.filter((m) => !MODE_ORDER.includes(m)),
  ]
  const activeMode = mode && modes.includes(mode) ? mode : modes[0] || null
  // The saving % a mode advertises (the pay-once discount), for the toggle badge.
  const savingFor = (m) => all.find((p) => (p.paymentMode || 'one-time') === m && p.savingPercent)?.savingPercent ?? null

  // The plan cards for the selected mode, Nirmaan before Nirmaan + Test.
  const shown = all
    .filter((p) => (p.paymentMode || 'one-time') === activeMode)
    .sort((a, b) => Number(a.includesPsychometric) - Number(b.includesPsychometric))

  // Every plan with the test has a twin without it on the same payment terms.
  const twinWithoutTest = (pkg) =>
    all.find((p) => !p.includesPsychometric && p.paymentMode === pkg.paymentMode)

  // What the CTA should do for a given package, given the user's enrollment.
  const ctaFor = (pkg) => {
    if (!upg) return { kind: 'buy' }
    if (upg.currentPackage.packageId === pkg.sku) {
      const ph = upg.phase
      if (ph?.paymentMode === 'per-phase') {
        return ph.nextPhase
          ? { kind: 'next-phase', phase: ph.nextPhase, total: ph.total, amount: ph.amount }
          : { kind: 'all-paid' }
      }
      return { kind: 'current' }
    }
    if (upg.phase?.paymentMode === 'per-phase') return { kind: 'locked-payu' }
    const opt = upg.options.find((o) => o.packageId === pkg.sku)
    if (opt) return upg.withinWindow ? { kind: 'upgrade', amount: opt.amount } : { kind: 'closed' }
    return { kind: 'owned' }
  }

  const renderCta = (pkg) => {
    const cta = ctaFor(pkg)
    if (cta.kind === 'current')
      return <button className={BTN_DISABLED} disabled>Current plan</button>
    if (cta.kind === 'next-phase')
      return (
        <Link to={`/checkout?pkg=${pkg.sku}`} className={BTN_PRIMARY}>
          Pay for phase {cta.phase} of {cta.total} · {inr(cta.amount)}
        </Link>
      )
    if (cta.kind === 'all-paid')
      return <button className={BTN_DISABLED} disabled>All phases paid</button>
    if (cta.kind === 'locked-payu')
      return <button className={BTN_DISABLED} disabled>Continue your current plan</button>
    if (cta.kind === 'upgrade')
      return <Link to={`/checkout?pkg=${pkg.sku}`} className={BTN_PRIMARY}>Upgrade · pay {inr(cta.amount)}</Link>
    if (cta.kind === 'closed')
      return <button className={BTN_DISABLED} disabled>Upgrade window closed</button>
    if (cta.kind === 'owned')
      return <button className={BTN_DISABLED} disabled>Included in your plan</button>
    return (
      <Link to={`/checkout?pkg=${pkg.sku}`} className={pkg.featured ? BTN_PRIMARY : BTN_OUTLINE}>
        {pkg.cta} <ArrowRight className="size-4" />
      </Link>
    )
  }

  return (
    <section id="packages" className="bg-nirmaan-cream/50 py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-nirmaan-green">Packages</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown sm:text-4xl">
            Choose your journey
          </h2>
          <p className="mt-4 text-lg text-nirmaan-brown-soft">
            Pick your plan, then choose how you’d like to pay.
          </p>
        </div>

        {error && <p className="mt-8 text-center text-nirmaan-brown-soft">Couldn’t load packages. Please try again later.</p>}
        {packages == null && !error && <p className="mt-8 text-center text-nirmaan-brown-soft">Loading packages…</p>}

        {/* Payment-mode toggle */}
        {modes.length > 1 && (
          <div className="mt-10 flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-full border border-nirmaan-sand bg-white p-1 shadow-sm">
              {modes.map((m) => {
                const active = m === activeMode
                const save = savingFor(m)
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    aria-pressed={active}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border-0 px-5 py-2.5 text-sm font-semibold transition-colors ${
                      active ? 'bg-nirmaan-green text-white' : 'bg-transparent text-nirmaan-brown-soft hover:text-nirmaan-brown'
                    }`}
                  >
                    {MODE_LABELS[m] || m}
                    {save != null && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                          active ? 'bg-white/20 text-white' : 'bg-nirmaan-green/10 text-nirmaan-green'
                        }`}
                      >
                        Save {save}%
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {shown.length > 0 && (
          <div className="mx-auto mt-10 grid max-w-4xl items-start gap-6 sm:grid-cols-2">
            {shown.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative flex flex-col rounded-xl border bg-white p-6 shadow-sm ${
                  pkg.featured ? 'border-nirmaan-green/40 ring-2 ring-nirmaan-green/15' : 'border-nirmaan-sand'
                }`}
              >
                {pkg.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-nirmaan-green px-3 py-1 text-xs font-semibold text-white">
                    {pkg.badge}
                  </span>
                )}
                <div className="font-display text-lg font-bold text-nirmaan-brown">{planName(pkg)}</div>
                <p className="mt-1 text-sm text-nirmaan-brown-soft">{pkg.tagline}</p>

                <div className="mt-4">
                  {pkg.earlyBird ? (
                    <>
                      <span className="font-display text-3xl font-extrabold text-nirmaan-brown">{pkg.earlyBird}</span>{' '}
                      <span className="text-sm text-nirmaan-brown-soft">one-time</span>
                      <div className="mt-1 text-sm text-nirmaan-brown-soft">
                        <s>{pkg.price}</s>
                        {pkg.savingPercent ? ` · save ${pkg.savingPercent}%` : ''}
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="font-display text-3xl font-extrabold text-nirmaan-brown">{pkg.price}</span>{' '}
                      <span className="text-sm text-nirmaan-brown-soft">{pkg.period}</span>
                      {pkg.totalPrice && (
                        <div className="mt-1 text-sm text-nirmaan-brown-soft">{pkg.phases} phases · {pkg.totalPrice} in total</div>
                      )}
                    </>
                  )}
                </div>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-nirmaan-brown">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-nirmaan-green" />
                      {f}
                    </li>
                  ))}
                </ul>

                {pkg.includesPsychometric && (
                  <div className="mt-5 rounded-lg border border-nirmaan-sand bg-nirmaan-cream/60 p-3 text-xs leading-relaxed text-nirmaan-brown-soft">
                    <p>Psychometric testing is for students in classes {PSY_MIN_CLASS} to {PSY_MAX_CLASS}.</p>
                    {outOfBand && (
                      <p className="mt-2 font-medium text-nirmaan-brown">
                        Your profile says class {myClass}. The test is not offered for that class, so
                        this plan is not the one for you.{' '}
                        {twinWithoutTest(pkg)
                          ? `Take ${planName(twinWithoutTest(pkg))} instead — same course, same terms, without the test.`
                          : 'Please pick the plan without the test.'}
                      </p>
                    )}
                  </div>
                )}

                {renderCta(pkg)}
              </div>
            ))}
          </div>
        )}

        {all.some((p) => p.includesPsychometric) && (
          <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-nirmaan-sand bg-white p-8">
            <h3 className="font-display text-xl font-bold text-nirmaan-brown">About the psychometric test</h3>
            <p className="mt-3 text-sm leading-relaxed text-nirmaan-brown-soft">
              Some of the plans above include a psychometric test. It is a set of simple questions
              about what you enjoy, what comes easily to you and how you like to work. There is no
              pass or fail, and no studying for it.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-nirmaan-brown">
              <li className="flex items-start gap-2.5">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-nirmaan-green" />
                It is scored on the RIASEC scale, which sorts what interests a student into six broad types.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-nirmaan-green" />
                You get a report of up to 40 pages — strengths, weaker areas, personality, interests and preferences, in plain language.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-nirmaan-green" />
                The report names the top 5 careers that suit the student best.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-nirmaan-green" />
                The test is for students in classes {PSY_MIN_CLASS} to {PSY_MAX_CLASS}.
              </li>
            </ul>
            <Link
              to="/skill-build/psychometric-testing"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-nirmaan-green hover:underline"
            >
              Read more about the test <ArrowRight className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
