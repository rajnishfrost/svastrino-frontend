import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { useAuth } from '../../../../context/AuthContext.jsx'

/**
 * Pricing — rendered from the hard-coded NIRMAAN_PACKAGE_CONTENT sheet below
 * (no longer fetched from the backend catalog). Prices, inclusions, benefits
 * and copy all live in this file.
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

/**
 * ⏳ PENDING REVIEW — hard-coded card content, transcribed from the 2026 plans
 * comparison sheet (the 4-column screenshot: Nirmaan Course / Nirmaan +
 * Psychometric Testing, each in Pay Once / Pay as you use).
 *
 * NOTHING BELOW IS WIRED INTO THE UI YET. Once the wording is approved, the
 * cards will render from this constant instead of the API response.
 *
 * Shape mirrors the API's flat 4-package list, so it can drop straight into the
 * existing two-axis toggle (paymentMode) with no other changes:
 *   • includesPsychometric → which of the two plan cards
 *   • paymentMode ('one-time' | 'per-phase') → which toggle position
 *   • sku → the /checkout?pkg=… link, unchanged
 *
 * Notes for review:
 *   – Costs are kept EXACTLY as written on the sheet (bare numbers, no ₹ symbol
 *     or thousands re-formatting) so you can eyeball the transcription.
 *   – The sheet splits content into "Inclusions" and "Benefits"; both lists are
 *     kept separate here in case you want to render them as two groups.
 *   – `cta` is NOT on the sheet — it's carried over from the current buttons.
 *   – Toggle labels on the sheet read "Pay Once" / "Pay as you use" (the current
 *     UI's per-phase label is "Pay as you go" — flag if you want it changed).
 */
const NIRMAAN_PACKAGE_CONTENT = [
  // ── Nirmaan Course · Pay Once ─────────────────────────────────────────────
  {
    sku: 'nirmaan-full',
    title: 'Nirmaan Course',
    includesPsychometric: false,
    paymentMode: 'one-time',
    modeLabel: 'Pay Once',
    inclusions: [
      '24 life changing concepts',
      'Structured personal skill development',
      'Structured professional skill development',
      'Tasks for daily development',
      'Daily progress tracking',
      'Daily reminders',
      '6 months course content',
      '1 year validity to complete the course',
      'Flat 25% support for students paying the whole fees at once',
    ],
    benefits: [
      'Concepts planned for students specifically',
      'Mindset + Self-Development + Confidence + Action = Impact',
      'Strong self awareness & self belief',
      'Pay at once and get a 25% discount immediately',
    ],
    pricing: {
      actualCost: '6,000',
      investment: 'Flat 25% Discount',
      supportCost: '4,500',
    },
    cta: 'Get Nirmaan', // not on the sheet — carried over from current UI
  },

  // ── Nirmaan Course · Pay as you use ───────────────────────────────────────
  {
    sku: 'nirmaan-payu',
    title: 'Nirmaan Course',
    includesPsychometric: false,
    paymentMode: 'per-phase',
    modeLabel: 'Pay As You Use',
    inclusions: [
      '24 life changing aspects of future life',
      'Structured personal skill development',
      'Structured professional skill development',
      'Tasks for daily development',
      'Daily progress tracking',
      'Daily tasks reminders',
      '6 months course content',
      'Total course completion validity is 1 year',
      'Video and tasks validity is 1 year from 1st enrollment',
      'Each video can be played 5 times',
      'After the 1-year course period ends, tasks can be viewed for 3 years',
      'Spread the cost across 6 equal installments (Without Interest)',
    ],
    benefits: [
      'Concepts planned for students specifically',
      'Mindset + Self-Development + Confidence + Action = Impact',
      'Strong self awareness & self belief',
      'Resume where you left off by paying for the next phase of the course',
    ],
    pricing: {
      actualCost: '6,000',
      investment: 'Phase wise payment offer, No Interest at all',
      supportCost: '1,000 x 6 = 6,000',
    },
    cta: 'Start with 1 phase', // not on the sheet — carried over from current UI
  },

  // ── Nirmaan + Psychometric Testing · Pay Once ─────────────────────────────
  {
    sku: 'nirmaan-psy-full',
    title: 'Nirmaan + Psychometric Testing',
    includesPsychometric: true,
    paymentMode: 'one-time',
    modeLabel: 'Pay Once',
    inclusions: [
      '24 life changing concepts',
      'Structured personal skill development',
      'Structured professional skill development',
      'Tasks for daily development',
      'Daily progress tracking',
      'Daily reminders',
      '6 months course content',
      '1 year validity to complete the course',
      "India's best psychometric testing",
      'Guidance based on the RIASEC scale',
      'Up to 40-page test report covering strengths, weakness, personality, interest, preferences and your top 5 suitable career options',
      'Psychometric testing is available only for students in Classes 7 to 12',
      'Flat 25% support for students paying the whole fees at once',
    ],
    benefits: [
      'Concepts planned for students specifically',
      'Mindset + Self-Development + Confidence + Action = Impact',
      'Strong self awareness & self belief',
      'Pay at once and get a 25% discount immediately',
    ],
    pricing: {
      actualCost: '6,900',
      investment: 'Flat 25% Discount',
      supportCost: '5,175',
    },
    cta: 'Get Nirmaan + Test', // not on the sheet — carried over from current UI
  },

  // ── Nirmaan + Psychometric Testing · Pay as you use ───────────────────────
  {
    sku: 'nirmaan-psy-payu',
    title: 'Nirmaan + Psychometric Testing',
    includesPsychometric: true,
    paymentMode: 'per-phase',
    modeLabel: 'Pay As You Use',
    inclusions: [
      '24 life changing aspects of future life',
      'Structured personal skill development',
      'Structured professional skill development',
      'Tasks for daily development',
      'Daily progress tracking',
      'Daily tasks reminders',
      '6 months course content',
      'Total course completion validity is 1 year',
      'Video and tasks validity is 1 year from 1st enrollment',
      'Each video can be played 5 times',
      'After the 1-year course period ends, tasks can be viewed for 3 years',
      "India's best psychometric testing",
      'Guidance based on the RIASEC scale',
      'Up to 40-page test report covering strengths, weakness, personality, interest, preferences and your top 5 suitable career options',
      'Psychometric testing is available only for students in Classes 7 to 12',
      'Spread the cost across 6 equal installments (Without Interest)',
    ],
    benefits: [
      'Concepts planned for students specifically',
      'Mindset + Self-Development + Confidence + Action = Impact',
      'Strong self awareness & self belief',
      'Resume where you left off by paying for the next phase of the course',
    ],
    pricing: {
      actualCost: '6,900',
      investment: 'Phase wise payment offer, No Interest at all',
      supportCost: '1,150 x 6 = 6,900',
    },
    cta: 'Start with 1 phase', // not on the sheet — carried over from current UI
  },
]

export default function Packages() {
  const { user } = useAuth()
  const [mode, setMode] = useState(null) // selected paymentMode (null → first available)

  // We only judge a visitor we actually know something about. An account with
  // no class on it gets the plain eligibility line and nothing else.
  const myClass = classNumber(user?.studentClass)
  const outOfBand = myClass != null && (myClass < PSY_MIN_CLASS || myClass > PSY_MAX_CLASS)

  // ---- Derive the two axes from the sheet ----
  const presentModes = [...new Set(NIRMAAN_PACKAGE_CONTENT.map((p) => p.paymentMode))]
  const modes = [
    ...MODE_ORDER.filter((m) => presentModes.includes(m)),
    ...presentModes.filter((m) => !MODE_ORDER.includes(m)),
  ]
  const activeMode = mode && modes.includes(mode) ? mode : modes[0] || null
  const modeLabel = (m) => NIRMAAN_PACKAGE_CONTENT.find((p) => p.paymentMode === m)?.modeLabel || m
  // The saving % a mode advertises (the pay-once discount), for the toggle badge.
  const savingFor = (m) => {
    const p = NIRMAAN_PACKAGE_CONTENT.find((x) => x.paymentMode === m)
    return p ? savingPercentOf(p) : null
  }

  // The plan cards for the selected mode, Nirmaan before Nirmaan + Test.
  const shown = NIRMAAN_PACKAGE_CONTENT
    .filter((p) => p.paymentMode === activeMode)
    .sort((a, b) => Number(a.includesPsychometric) - Number(b.includesPsychometric))

  // Every plan with the test has a twin without it on the same payment terms.
  const twinWithoutTest = (pkg) =>
    NIRMAAN_PACKAGE_CONTENT.find((p) => !p.includesPsychometric && p.paymentMode === pkg.paymentMode)

  // The pay-once, no-test plan is the highlighted "Best value" card.
  const isFeatured = (pkg) => pkg.paymentMode === 'one-time' && !pkg.includesPsychometric

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
                      Best value
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

        {NIRMAAN_PACKAGE_CONTENT.some((p) => p.includesPsychometric) && (
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
