import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, GraduationCap } from 'lucide-react'
import { usePageSeo } from '../../../seo/PageSeo.jsx'
import StudentJourney from './sections/StudentJourney.jsx'

/**
 * Psychometric Testing — the second Skill-Build product, sold alongside Nirmaan.
 * Content per src/content/psychometric-test.md. Like the Nirmaan page it wears
 * the green/brown/cream palette while it is open, so the whole chrome shifts
 * with it (the `theme-nirmaan` body class remaps the shared design tokens).
 */
const UNCOVERS = ['Interests', 'Preferences', 'Strengths', 'Weaknesses', 'Personality', 'Abilities', 'Natural Potential']

const HOW_IT_WORKS = [
  { title: 'Take the Test', text: 'Answer simple questions about your abilities, aptitude, personality, and behaviors.' },
  { title: 'Verification', text: "Your responses get analysed across different parameters & style (There's no right or wrong here, so just be yourself)." },
  { title: 'Integrating', text: 'The algorithm identifies industries, jobs, and careers that match you & your needs.' },
  { title: 'Scientific Report', text: "You'll receive a clear report with insights and career recommendations, tailored just for you." },
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
    who: '7th, 8th, or 9th Class (any board)',
    points: [
      'You want to understand your interests, strengths, and personality better',
      "You're trying to choose between Science, Commerce, or Humanities/Arts",
    ],
  },
  {
    name: 'Career Selector',
    who: '10th, 11th, or 12th Class (any board or stream)',
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
      {/* ---- Section 1 · Intro banner ----
          Two-column split (copy left, flat illustration right) to match the
          hero treatment on the other public pages. Stacks and re-centres on
          narrow screens. */}
      <section className="relative overflow-hidden bg-gradient-to-br from-nirmaan-cream to-white py-14">
        <div className="container relative grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <p className="text-sm font-semibold uppercase tracking-wide text-nirmaan-green">
              Skill Build · Psychometric Testing
            </p>
            <h1 className="capitalize mx-auto mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-nirmaan-brown sm:text-5xl lg:mx-0">
              Not sure which stream or career actually fits you?
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-nirmaan-brown-soft lg:mx-0">
              Take this simple test to uncover your natural potential in just 4 easy steps. It&rsquo;s
              simple — find the best suitable streams or career options that match your interests &amp;
              aspirations.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 lg:justify-start sm:items-start">
              <a
                href="#which-test"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-nirmaan-green px-7 text-base font-semibold text-white shadow-sm transition-colors hover:bg-nirmaan-green-dark"
              >
                Stream Selector <span className="text-sm font-normal text-white/80">(Class 7–9 Students)</span>
              </a>
              <a
                href="#which-test"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-nirmaan-green/40 bg-white px-7 text-base font-semibold text-nirmaan-green transition-colors hover:bg-nirmaan-green hover:text-white"
              >
                Career Selector <span className="text-sm font-normal opacity-80">(Class 10–12 Students)</span>
              </a>
            </div>
          </div>

          {/* Flat illustration — sits on a soft, on-theme glow so it reads as a
              designed scene rather than a pasted image. */}
          <div className="relative flex justify-center lg:justify-end">
            <span aria-hidden className="pointer-events-none absolute inset-0 m-auto size-72 rounded-full bg-nirmaan-green/10 blur-3xl sm:size-96" />
            <img
              src="/assets/images/psy-test-1-t.png"
              alt=""
              loading="eager"
              className="relative w-full max-w-md h-auto lg:max-w-lg"
            />
          </div>
        </div>
      </section>

      {/* ---- Section 2 · What is Psychometric Testing? ---- */}
      <section className="bg-white py-16 ">
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

      {/* ---- Section 4 · Student Journey (serpentine road timeline) ---- */}
      <StudentJourney />

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
                  <span className="font-display text-lg font-bold text-nirmaan-brown">₹900 Only</span>
                  <Link
                    to="/contact"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-nirmaan-green px-5 text-sm font-semibold text-white transition-colors hover:bg-nirmaan-green-dark"
                  >
                    {t.name} <ArrowRight className="size-4" />
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
          <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 overflow-hidden rounded-[2rem] border border-nirmaan-cream-dark bg-white p-8 text-center shadow-sm sm:flex-row sm:gap-8 sm:p-9 sm:text-left">
            {/* Branded accent ribbon + soft glow, matching the Nirmaan cards elsewhere. */}
            <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-nirmaan-green via-nirmaan-green-light to-nirmaan-olive" />
            <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-nirmaan-green/10 blur-2xl" />

            {/* The 25% discount is the hook — give it a medallion. */}
            <div className="relative flex size-24 shrink-0 flex-col items-center justify-center rounded-full bg-nirmaan-green text-white shadow-sm ring-4 ring-nirmaan-green/15">
              <span className="font-display text-2xl font-extrabold leading-none">25%</span>
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90">off</span>
            </div>

            {/* Copy */}
            <div className="relative flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-nirmaan-brown px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                <GraduationCap className="size-3.5" /> Bundle offer
              </span>
              <p className="mt-3 font-display text-xl font-extrabold leading-snug tracking-tight text-nirmaan-brown sm:text-2xl">
                Club it with <span className="text-nirmaan-green">Nirmaan</span> &amp; get a flat 25% discount
              </p>
              {/* <p className="mt-2 text-sm text-nirmaan-brown-soft">
                Our investment in your development — pair the test with the full Nirmaan course and save.
              </p> */}
            </div>

            {/* CTA */}
            <Link
              to="/skill-build/nirmaan#packages"
              className="relative inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-nirmaan-green px-7 text-base font-semibold text-white shadow-sm transition-colors hover:bg-nirmaan-green-dark"
            >
              View Nirmaan plans <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
