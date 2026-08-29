import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { usePageSeo } from '../../../seo/PageSeo.jsx'

/**
 * Psychometric Testing — the second Skill-Build product, sold alongside Nirmaan.
 * Content per src/content/psychometric-test.md. Like the Nirmaan page it wears
 * the green/brown/cream palette while it is open, so the whole chrome shifts
 * with it (the `theme-nirmaan` body class remaps the shared design tokens).
 */
const UNCOVERS = ['Interests', 'Preferences', 'Strengths', 'Weaknesses', 'Personality', 'Abilities', 'Natural Potential']

const HOW_IT_WORKS = [
  { title: 'Take the test', text: 'Answer simple questions about your abilities, aptitude, personality, and behaviours.' },
  { title: 'Verification', text: "Your responses get analysed across different parameters & style. There's no right or wrong here, so just be yourself." },
  { title: 'Integrating', text: 'The algorithm identifies industries, jobs, and careers that match you & your needs.' },
  { title: 'Scientific Report', text: "You'll receive a clear report with insights and career recommendations, tailored just for you." },
]

const JOURNEY = [
  { title: 'Choose Your Test', text: 'Select the assessment based on your class and career stage.' },
  { title: 'Take the Assessment', text: 'Answer each question honestly; there are no right or wrong answers.' },
  { title: 'Understand Your Profile', text: 'Get clear insights into your interests, strengths, and suitable directions.' },
  { title: 'Explore Your Options', text: 'Use your results to explore streams, subjects, and career paths with confidence.' },
]

const STUDENTS = [
  'Get clarity on what genuinely interests you',
  'Discover strengths you may not have recognised',
  'Choose subjects, stream and careers with confidence',
  "Explore paths you are made for but haven't considered",
  'Make decisions through confidence and clarity',
]

const PARENTS = [
  "See your child's interests beyond their marks",
  'Have better, more informed conversations about their future',
  'Avoid choices driven by trends, society, or peer pressure',
  'Start career conversations from a place of clarity, not confusion',
]

const TESTS = [
  {
    name: 'Stream Selector',
    who: 'Class 7th, 8th, or 9th (any board)',
    points: [
      'You want to understand your interests, strengths, and personality better',
      "You're trying to choose between Science, Commerce, or Humanities/Arts",
    ],
  },
  {
    name: 'Career Selector',
    who: 'Class 10th, 11th, or 12th (any board or stream)',
    points: [
      'You want to understand your interests, strengths, and personality better',
      "You're trying to find careers that truly match your interests, personality, and future plans",
    ],
  },
]

export default function Psychometric() {
  usePageSeo({
    title: 'Psychometric testing — know your strengths before you choose',
    description: 'A RIASEC-based psychometric assessment with a report of up to 40 pages covering your strengths, personality, interests and top five suitable careers.',
  })
  useEffect(() => {
    document.body.classList.add('theme-nirmaan')
    return () => document.body.classList.remove('theme-nirmaan')
  }, [])

  return (
    <div>
      {/* ---- Section 1 · Intro banner ---- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-nirmaan-cream to-white py-16 md:py-24">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-nirmaan-green/10 blur-3xl" />
        <div className="container relative text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-nirmaan-green">
            Skill Build · Psychometric Testing
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-nirmaan-brown sm:text-5xl">
            Not sure which stream or career actually fits you?
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-nirmaan-brown-soft">
            Take this simple test to uncover your natural potential in just 4 easy steps. It&rsquo;s
            simple — find the best suitable streams or career options that match your interests &amp;
            aspirations.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#which-test"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-nirmaan-green px-7 text-base font-semibold text-white shadow-sm transition-colors hover:bg-nirmaan-green-dark"
            >
              Stream Selector <span className="text-sm font-normal text-white/80">(Class 7th–9th)</span>
            </a>
            <a
              href="#which-test"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-nirmaan-green/40 bg-white px-7 text-base font-semibold text-nirmaan-green transition-colors hover:bg-nirmaan-green hover:text-white"
            >
              Career Selector <span className="text-sm font-normal opacity-80">(Class 10th–12th)</span>
            </a>
          </div>
        </div>
      </section>

      {/* ---- Section 2 · What is Psychometric Testing? ---- */}
      <section className="bg-white py-16 md:py-20">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown sm:text-4xl">
            What is Psychometric Testing?
          </h2>
          <p className="mt-5 text-lg text-nirmaan-brown-soft">
            Think of it like a blood test — but for your career choices. A psychometric test helps
            you discover your:
          </p>
          <ul className="mt-6 flex flex-wrap justify-center gap-2.5">
            {UNCOVERS.map((u) => (
              <li
                key={u}
                className="inline-flex items-center gap-1.5 rounded-full border border-nirmaan-sand bg-nirmaan-cream px-4 py-1.5 text-sm font-medium text-nirmaan-brown"
              >
                <Check className="size-4 text-nirmaan-green" /> {u}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-nirmaan-brown-soft">
            It then uses these insights to help you make better stream and career choices with more
            clarity and confidence.
          </p>
        </div>
      </section>

      {/* ---- Section 3 · How It Works ---- */}
      <section className="bg-nirmaan-cream/50 py-16 md:py-20">
        <div className="container">
          <h2 className="text-center font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown sm:text-4xl">
            How It Works
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={s.title} className="rounded-xl border border-nirmaan-sand bg-white p-6 shadow-sm">
                <span className="flex size-10 items-center justify-center rounded-full bg-nirmaan-green font-display text-base font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-nirmaan-brown">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-nirmaan-brown-soft">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Section 4 · Student Journey (vertical zig-zag timeline) ---- */}
      <section className="bg-white py-16 md:py-20">
        <div className="container">
          <h2 className="text-center font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown sm:text-4xl">
            Student Journey
          </h2>

          {/* Desktop: cards alternate left/right around a central spine. */}
          <div className="relative mx-auto mt-14 hidden max-w-4xl lg:block">
            <div
              className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 rounded-full"
              style={{ background: 'linear-gradient(#3f7932, #90743c, #3b2822)' }}
              aria-hidden
            />
            <ol className="space-y-8">
              {JOURNEY.map((s, i) => {
                const left = i % 2 === 0
                const card = (
                  <div className={`rounded-xl border border-nirmaan-sand bg-white p-6 shadow-sm ${left ? 'text-right' : 'text-left'}`}>
                    <h3 className="font-display text-lg font-bold text-nirmaan-brown">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-nirmaan-brown-soft">{s.text}</p>
                  </div>
                )
                return (
                  <li key={s.title} className="relative grid grid-cols-2 items-center gap-16">
                    <span className="absolute left-1/2 top-1/2 z-10 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-nirmaan-green font-display text-lg font-bold text-white shadow-md">
                      {i + 1}
                    </span>
                    {left ? (
                      <>
                        {card}
                        <div />
                      </>
                    ) : (
                      <>
                        <div />
                        {card}
                      </>
                    )}
                  </li>
                )
              })}
            </ol>
          </div>

          {/* Mobile / tablet: a single left-rail timeline. */}
          <ol className="mx-auto mt-12 max-w-md lg:hidden">
            {JOURNEY.map((s, i) => (
              <li key={s.title} className="relative flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-nirmaan-green font-display text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  {i < JOURNEY.length - 1 && <span className="my-1 w-0.5 flex-1 rounded-full bg-nirmaan-green/20" />}
                </div>
                <div className="mb-6 flex-1 rounded-xl border border-nirmaan-sand bg-white p-5 shadow-sm">
                  <h3 className="font-display text-base font-bold text-nirmaan-brown">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-nirmaan-brown-soft">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---- Section 5 · How Can This Test Help You? ---- */}
      <section className="bg-nirmaan-cream/50 py-16 md:py-20">
        <div className="container">
          <h2 className="text-center font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown sm:text-4xl">
            How Can This Test Help You?
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {[
              { title: 'For Students', points: STUDENTS },
              { title: 'For Parents', points: PARENTS },
            ].map((col) => (
              <div key={col.title} className="rounded-xl border border-nirmaan-sand bg-white p-7 shadow-sm">
                <h3 className="font-display text-xl font-bold text-nirmaan-brown">{col.title}</h3>
                <ul className="mt-4 space-y-3">
                  {col.points.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-sm text-nirmaan-brown">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-nirmaan-green">
                        <Check className="size-3 text-white" />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Section 6 · Find Which Test Is Right for You ---- */}
      <section id="which-test" className="bg-white py-16 md:py-20">
        <div className="container">
          <h2 className="text-center font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown sm:text-4xl">
            Find Which Test Is Right for You
          </h2>

          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            {TESTS.map((t) => (
              <div key={t.name} className="flex flex-col rounded-xl border border-nirmaan-sand bg-white p-7 shadow-sm">
                <h3 className="font-display text-xl font-bold text-nirmaan-brown">{t.name}</h3>
                <p className="mt-1 text-sm font-semibold text-nirmaan-green">{t.who}</p>
                <ul className="mt-4 flex-1 space-y-2.5">
                  {t.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-nirmaan-brown">
                      <Check className="mt-0.5 size-4 shrink-0 text-nirmaan-green" />
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex items-center justify-between border-t border-nirmaan-sand pt-4">
                  <span className="font-display text-lg font-bold text-nirmaan-brown">₹900</span>
                  <Link
                    to="/contact"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-nirmaan-green px-5 text-sm font-semibold text-white transition-colors hover:bg-nirmaan-green-dark"
                  >
                    Select {t.name} <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Section 7 · Package Plans (bundle with Nirmaan) ---- */}
      <section className="bg-nirmaan-cream/50 py-16 md:py-20">
        <div className="container">
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 rounded-2xl border border-nirmaan-sand bg-white p-8 text-center sm:flex-row sm:text-left">
            <p className="text-lg font-medium text-nirmaan-brown">
              Club it with <strong className="font-bold">Nirmaan</strong> &amp; get a{' '}
              <strong className="font-bold text-nirmaan-green">flat 25% discount</strong> as our
              investment in your development.
            </p>
            <Link
              to="/skill-build/nirmaan#packages"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-nirmaan-green px-7 text-base font-semibold text-white transition-colors hover:bg-nirmaan-green-dark"
            >
              View Nirmaan plans <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
