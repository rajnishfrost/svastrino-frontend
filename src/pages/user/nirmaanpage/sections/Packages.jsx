import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { useAuth } from '../../../../context/AuthContext.jsx'
import { api } from '../../../../api/client.js'

/**
 * Pricing — read from the catalogue at /api/user/skill-build/nirmaan, which is
 * the same record checkout prices against. That single source is the point: a
 * price edited in the admin panel is the price on this card AND the price the
 * student is charged, with no second copy to forget.
 *
 * The sheet holds four entries that are really TWO axes:
 *   • plan            — Nirmaan  vs  Nirmaan + Psychometric Testing  (includesPsychometric)
 *   • payment struct. — Pay once vs  Pay as you use                  (paymentMode)
 * So instead of four cards we show a payment-mode TOGGLE and, under it, the two
 * plan cards for the selected mode. Everything is derived from the entry fields.
 *
 * Two of the plans bundle the psychometric test, which is written for classes
 * 7 to 12 and sold to nobody outside that band. The card says the rule out loud
 * first, so nobody meets it for the first time with their card details typed in.
 */

// The band the test is written and scored for (2026 plans sheet).
const PSY_MIN_CLASS = 7
const PSY_MAX_CLASS = 12

// Display order for the payment-mode toggle; the visible labels come from each
// entry's `modeLabel`. Any mode not listed here still shows, appended after.
const MODE_ORDER = ['one-time', 'per-phase']

// Pull a rupee amount out of a sheet cost string: "6,000" → 6000. A compound
// like "1,000 x 6 = 6,000" resolves to the total (the number after the "=").
const costValue = (s) => {
  const str = String(s || '')
  const tail = str.includes('=') ? str.slice(str.lastIndexOf('=') + 1) : str
  return Number(tail.replace(/[^\d]/g, '')) || 0
}

// The discount a card advertises — how much less its support cost is than its
// actual cost. null when they match (e.g. the pay-as-you-use total).
const savingPercentOf = (pkg) => {
  const actual = costValue(pkg.pricing.actualCost)
  const support = costValue(pkg.pricing.supportCost)
  return actual > 0 && support < actual ? Math.round(((actual - support) / actual) * 100) : null
}

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

/** Paise → the bare Indian-format number the cards print after a ₹. */
const fmtInr = (paise) => (Math.round(Number(paise) || 0) / 100).toLocaleString('en-IN')

/**
 * A catalogue row as the cards want it. The three cost lines are worked out
 * here rather than stored, because they are all the same two numbers dressed
 * differently:
 *   pay once     — actual = list price, support = the discounted price
 *   pay as you use — actual = the whole run, support = "1,000 x 6 = 6,000"
 * `phases` belongs to the course, not to the terms: Nirmaan is six phases
 * either way, and paying once simply opens all of them at once.
 */
const toCard = (p) => {
  const perPhase = p.paymentMode === 'per-phase' && p.phases > 1
  const total = perPhase ? p.priceValue * p.phases : p.priceValue
  const support = p.earlyBirdValue != null ? p.earlyBirdValue : p.priceValue
  return {
    sku: p.sku,
    title: p.name,
    includesPsychometric: !!p.includesPsychometric,
    paymentMode: p.paymentMode || 'one-time',
    modeLabel: p.modeLabel || (p.paymentMode === 'per-phase' ? 'Pay As You Use' : 'Pay Once'),
    inclusions: p.features || [],
    benefits: p.benefits || [],
    pricing: {
      actualCost: fmtInr(total),
      investment: p.priceNote || '',
      supportCost: perPhase
        ? `${fmtInr(p.priceValue)} x ${p.phases} = ${fmtInr(total)}`
        : fmtInr(support),
    },
    cta: p.cta || 'Buy now',
    featured: !!p.featured,
    badge: p.badge || 'Best value',
  }
}

export default function Packages() {
  const { user } = useAuth()
  const [mode, setMode] = useState(null) // selected paymentMode (null → first available)
  // undefined = still loading; [] = loaded and empty (or the request failed).
  const [packages, setPackages] = useState(undefined)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let live = true
    api('/user/skill-build/nirmaan')
      .then((d) => { if (live) setPackages((d.packages || []).map(toCard)) })
      .catch(() => { if (live) { setPackages([]); setFailed(true) } })
    return () => { live = false }
  }, [])

  const loading = packages === undefined
  const list = packages || []

  // We only judge a visitor we actually know something about. An account with
  // no class on it gets the plain eligibility line and nothing else.
  const myClass = classNumber(user?.studentClass)
  const outOfBand = myClass != null && (myClass < PSY_MIN_CLASS || myClass > PSY_MAX_CLASS)

  // ---- Derive the two axes from the sheet ----
  const presentModes = [...new Set(list.map((p) => p.paymentMode))]
  const modes = [
    ...MODE_ORDER.filter((m) => presentModes.includes(m)),
    ...presentModes.filter((m) => !MODE_ORDER.includes(m)),
  ]
  const activeMode = mode && modes.includes(mode) ? mode : modes[0] || null
  const modeLabel = (m) => list.find((p) => p.paymentMode === m)?.modeLabel || m
  // The saving % a mode advertises (the pay-once discount), for the toggle badge.
  const savingFor = (m) => {
    const p = list.find((x) => x.paymentMode === m)
    return p ? savingPercentOf(p) : null
  }

  // The plan cards for the selected mode, Nirmaan before Nirmaan + Test.
  const shown = list
    .filter((p) => p.paymentMode === activeMode)
    .sort((a, b) => Number(a.includesPsychometric) - Number(b.includesPsychometric))

  // Every plan with the test has a twin without it on the same payment terms.
  const twinWithoutTest = (pkg) =>
    list.find((p) => !p.includesPsychometric && p.paymentMode === pkg.paymentMode)

  // Which card is highlighted is a catalogue decision now (admin can move the
  // badge); the old rule stays as the answer when nothing is marked.
  const anyFeatured = list.some((p) => p.featured)
  const isFeatured = (pkg) =>
    anyFeatured ? pkg.featured : pkg.paymentMode === 'one-time' && !pkg.includesPsychometric

  return (
    <section id="packages" className="bg-nirmaan-cream py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-nirmaan-green">Packages</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown sm:text-4xl">
            Choose Your Journey
          </h2>
          <p className="mt-4 text-lg text-nirmaan-brown-soft">
            Pick your plan, then choose how you’d like to pay.
          </p>
        </div>

        {/* Payment-mode toggle */}
        {loading && (
          // Two card-shaped blocks so the section keeps its height and the page
          // below does not jump when the prices land.
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2" aria-hidden>
            {[0, 1].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-nirmaan-sand bg-white p-6">
                <div className="h-5 w-40 rounded bg-nirmaan-cream" />
                <div className="mt-4 h-24 rounded-lg bg-nirmaan-cream/70" />
                <div className="mt-5 space-y-2.5">
                  {[0, 1, 2, 3, 4, 5].map((j) => <div key={j} className="h-3.5 w-full rounded bg-nirmaan-cream/70" />)}
                </div>
                <div className="mt-6 h-11 rounded-lg bg-nirmaan-cream" />
              </div>
            ))}
          </div>
        )}

        {failed && (
          <p className="mt-10 text-center text-sm text-nirmaan-brown-soft">
            The plans could not be loaded just now.{' '}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-nirmaan-green underline"
            >
              Try again
            </button>
          </p>
        )}

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
                    {modeLabel(m)}
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
            {shown.map((pkg) => {
              const featured = isFeatured(pkg)
              const saving = savingPercentOf(pkg)
              return (
                <div
                  key={pkg.sku}
                  className={`relative flex flex-col rounded-xl border bg-white p-6 shadow-sm ${
                    featured ? 'border-nirmaan-green/40 ring-2 ring-nirmaan-green/15' : 'border-nirmaan-sand'
                  }`}
                >
                  {featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-nirmaan-green px-3 py-1 text-xs font-semibold text-white">
                      {pkg.badge}
                    </span>
                  )}
                  <div className="font-display text-lg font-bold text-nirmaan-brown">{pkg.title}</div>
                  <p className="mt-1 text-sm text-nirmaan-brown-soft">{pkg.modeLabel}</p>

                  {/* Pricing — the three cost lines from the sheet */}
                  <div className="mt-4 rounded-lg border border-nirmaan-sand bg-nirmaan-cream/40 p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-semibold text-nirmaan-brown">Support cost</span>
                      <span className="font-display text-2xl font-extrabold text-nirmaan-brown">₹{pkg.pricing.supportCost}</span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between gap-3 text-sm text-nirmaan-brown-soft">
                      <span>Actual cost</span>
                      {saving != null ? <s>₹{pkg.pricing.actualCost}</s> : <span>₹{pkg.pricing.actualCost}</span>}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-nirmaan-green">{pkg.pricing.investment}</p>
                  </div>

                  {/* Inclusions */}
                  <ul className="mt-5 space-y-2.5">
                    {pkg.inclusions.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-nirmaan-brown">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-nirmaan-green" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Benefits */}
                  <div className="mt-5 flex-1 border-t border-nirmaan-sand pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-nirmaan-green">Benefits</p>
                    <ul className="mt-3 space-y-2.5">
                      {pkg.benefits.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-nirmaan-brown">
                          <Check className="mt-0.5 size-4 shrink-0 text-nirmaan-green" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {pkg.includesPsychometric && (
                    <div className="mt-5 rounded-lg border border-nirmaan-sand bg-nirmaan-cream/60 p-3 text-xs leading-relaxed text-nirmaan-brown-soft">
                      <p>Psychometric testing is for students in classes {PSY_MIN_CLASS} to {PSY_MAX_CLASS}.</p>
                      {outOfBand && (
                        <p className="mt-2 font-medium text-nirmaan-brown">
                          Your profile says class {myClass}. The test is not offered for that class, so
                          this plan is not the one for you.{' '}
                          {twinWithoutTest(pkg)
                            ? `Take ${twinWithoutTest(pkg).title} instead — same course, same terms, without the test.`
                            : 'Please pick the plan without the test.'}
                        </p>
                      )}
                    </div>
                  )}

                  <Link to={`/checkout?pkg=${pkg.sku}`} className={featured ? BTN_PRIMARY : BTN_OUTLINE}>
                    {pkg.cta} <ArrowRight className="size-4" />
                  </Link>
                </div>
              )
            })}
          </div>
        )}

        {list.some((p) => p.includesPsychometric) && (
          <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-nirmaan-sand bg-white p-8">
            <h3 className="font-display text-xl font-bold text-nirmaan-brown">About the Psychometric Test</h3>
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
