import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, GraduationCap } from 'lucide-react'
import { usePageSeo } from '../../../seo/PageSeo.jsx'
import { useAuth } from '../../../context/AuthContext.jsx'
import { usePsychometric } from '../../../hooks/usePsychometric.js'
import PsychometricActions from '../../../common_component/user/PsychometricTest/PsychometricActions.jsx'
import StudentJourney from './sections/StudentJourney.jsx'
import Faqs from './sections/Faqs.jsx'

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

/**
 * Which of the two tests a class takes: 7 to 9 the Stream Selector, 10 to 12
 * the Career Selector — the split this page sells them under and the one the
 * server uses to pick the Mindler test. Null when the profile has no class in
 * that range yet; the test asks for it before it opens.
 */
function testNameFor(studentClass) {
  const n = Number(String(studentClass || '').match(/(?<!\d)\d{1,2}(?!\d)/)?.[0])
  if (n >= 7 && n <= 9) return 'Stream Selector'
  if (n >= 10 && n <= 12) return 'Career Selector'
  return null
}

// What the owner's panel says at each step of the test.
const OWNER_TITLE = {
  not_started: 'Your test is ready when you are',
  in_progress: 'Your test is in progress',
  submitted: 'Test done — your report is ready',
  completed: 'Your report is ready',
}

/**
 * The hero's panel for a student whose plan includes the test: where they are
 * with it, and the button for the next step — the same controls as the course
 * page, so they can take it from here without going through the course first.
 */
function OwnerPanel({ assessment, setAssessment, reload, yourTest }) {
  const status = assessment?.status || 'not_started'
  const careers = assessment?.report?.topCareers || []
  return (
    <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-nirmaan-sand bg-white p-6 text-left shadow-sm lg:mx-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-nirmaan-green">Included in your plan</p>
      <p className="mt-2 font-display text-xl font-bold text-nirmaan-brown">{OWNER_TITLE[status] || OWNER_TITLE.not_started}</p>

      {(status === 'not_started' || status === 'in_progress') && (
        <p className="mt-2 text-sm text-nirmaan-brown-soft">
          {yourTest
            ? <>Your test: <strong className="text-nirmaan-brown">{yourTest}</strong>, picked from your class.</>
            : 'We will ask which class you are in before the test opens — that decides your test.'}
          {status === 'in_progress' && (assessment?.mode === 'api'
            ? ' When you have answered every section, come back here and “See your report” appears by itself.'
            : ' When you have answered every section, tap “I’ve finished it”.')}
        </p>
      )}
      {/* The report is on the test site, not here: the button signs them in
          there, and it is under "My Report". */}
      {(status === 'submitted' || (status === 'completed' && !assessment?.report?.url)) && (
        <p className="mt-2 text-sm text-nirmaan-brown-soft">
          Your report and your best-fit careers are on the test site, under “My Report”. Tap below — you are signed in automatically.
        </p>
      )}
      {status === 'completed' && careers.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-semibold text-nirmaan-brown">Careers that suit you</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {careers.map((c) => (
              <li key={c} className="rounded-full border border-nirmaan-sand bg-nirmaan-cream px-3 py-1 text-sm text-nirmaan-brown">{c}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <PsychometricActions
          product="nirmaan"
          assessment={assessment}
          onChange={setAssessment}
          onFinished={reload}
        />
      </div>
    </div>
  )
}

export default function Psychometric() {
  usePageSeo({
    title: 'Psychometric testing — know your strengths before you choose',
    description: 'A RIASEC-based psychometric assessment with a report of up to 40 pages covering your strengths, personality, interests and top five suitable careers.',
  })
  useEffect(() => {
    document.body.classList.add('theme-nirmaan')
    return () => document.body.classList.remove('theme-nirmaan')
  }, [])

  // Who is looking. A student who already has the test is not sold it again:
  // the hero shows where they are with it, the price and the bundle offer go,
  // and a Nirmaan student without it is pointed at the upgrade instead.
  const { user } = useAuth()
  const { state: standing, assessment, setAssessment, reload } = usePsychometric('nirmaan')
  const owned = standing === 'owned'
  const noTest = standing === 'no-test'
  // Still asking the server. The selling parts stay hidden until it answers,
  // so an owner never sees a buy button flash up and vanish.
  const checking = standing === undefined
  const yourTest = testNameFor(user?.studentClass)

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
            {/* The pitch is for someone deciding whether to buy; an owner is told
                what the test is for instead. */}
            <h1 className="capitalize mx-auto mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-nirmaan-brown sm:text-5xl lg:mx-0">
              {owned ? 'Your psychometric test' : 'Not sure which stream or career actually fits you?'}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-nirmaan-brown-soft lg:mx-0">
              {/* Take this simple test to uncover your natural potential in just 4 easy steps. It&rsquo;s
              simple — find the best suitable streams or career options that match your interests &amp;
              aspirations. */}
              {owned
                ? 'Answer honestly — there are no right or wrong answers. Your report shows your interests, strengths and the careers that suit you.'
                : 'Take this test to uncover your natural potential in just 4 easy steps. Find the streams or careers that match your interests and aspirations.'}
            </p>
            {checking ? (
              // Holds the buttons' place while the server answers.
              <div className="mt-8 h-[108px]" aria-hidden />
            ) : owned ? (
              <OwnerPanel assessment={assessment} setAssessment={setAssessment} reload={reload} yourTest={yourTest} />
            ) : noTest ? (
              <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-nirmaan-sand bg-white p-6 text-left shadow-sm lg:mx-0">
                <p className="font-display text-lg font-bold text-nirmaan-brown">Your Nirmaan plan does not include the test yet</p>
                <p className="mt-2 text-sm text-nirmaan-brown-soft">
                  Upgrade to Nirmaan + Psychometric Testing and pay only the difference — everything you have done in the course stays as it is.
                </p>
                <Link
                  to="/skill-build/nirmaan#packages"
                  className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-nirmaan-green px-6 text-sm font-semibold text-white transition-colors hover:bg-nirmaan-green-dark"
                >
                  See upgrade options <ArrowRight className="size-4" />
                </Link>
              </div>
            ) : (
              <div className="mt-8 flex flex-col items-center justify-center gap-3 lg:justify-start sm:items-start">
                <a
                  href="#which-test"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-nirmaan-green px-7 text-base font-semibold text-white shadow-sm transition-colors hover:bg-nirmaan-green-dark"
                >
                  Stream Selector <span className="text-sm font-normal text-white/80">(Class 7–9 Students)</span>
                </a>
                <a
                  href="#which-test"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-nirmaan-green/40 px-7 text-base font-semibold transition-colors bg-nirmaan-green text-white"
                >
                  Career Selector <span className="text-sm font-normal opacity-80">(Class 10–12 Students)</span>
                </a>
              </div>
            )}
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
              <div
                key={t.name}
                className={`relative flex flex-col rounded-xl border bg-white p-7 shadow-sm ${
                  owned && t.name === yourTest ? 'border-nirmaan-green ring-2 ring-nirmaan-green/20' : 'border-nirmaan-sand'
                }`}
              >
                {owned && t.name === yourTest && (
                  <span className="absolute right-5 top-5 rounded-full bg-nirmaan-green px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    Your test
                  </span>
                )}
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
                {/* Price and buy button for someone who does not have the test;
                    an owner already paid for it, and a Nirmaan student without
                    it gets there through the upgrade. */}
                {checking ? null : owned ? (
                  t.name === yourTest && (
                    <p className="mt-6 border-t border-nirmaan-sand pt-4 text-sm font-semibold text-nirmaan-green">
                      Included in your plan
                    </p>
                  )
                ) : noTest ? (
                  <div className="mt-6 border-t border-nirmaan-sand pt-4">
                    <Link
                      to="/skill-build/nirmaan#packages"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-nirmaan-green px-5 text-sm font-semibold text-white transition-colors hover:bg-nirmaan-green-dark"
                    >
                      Add it to your plan <ArrowRight className="size-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="mt-6 flex items-center justify-between border-t border-nirmaan-sand pt-4">
                    <span className="font-display text-lg font-bold text-nirmaan-brown">₹900 Only</span>
                    <Link
                      to="/contact"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-nirmaan-green px-5 text-sm font-semibold text-white transition-colors hover:bg-nirmaan-green-dark"
                    >
                      {t.name} <ArrowRight className="size-4" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Section 7 · Package Plans (bundle with Nirmaan) ----
          Selling the bundle to someone who owns the test is noise, so owners do
          not see it; a Nirmaan student without the test sees it as an upgrade. */}
      {!checking && !owned && (
      <section className="bg-nirmaan-cream/50 py-16 md:py-20">
        <div className="container">
          <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 overflow-hidden rounded-[2rem] border border-nirmaan-cream-dark bg-white p-8 text-center shadow-sm sm:flex-row sm:gap-8 sm:p-9 sm:text-left">
            {/* Branded accent ribbon + soft glow, matching the Nirmaan cards elsewhere. */}
            <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-nirmaan-green via-nirmaan-green-light to-nirmaan-olive" />
            <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-nirmaan-green/10 blur-2xl" />

            {/* The 25% discount is the hook — give it a medallion. Not for an
                upgrade, which is priced as the difference, not 25% off. */}
            {!noTest && (
            <div className="relative flex size-24 shrink-0 flex-col items-center justify-center rounded-full bg-nirmaan-green text-white shadow-sm ring-4 ring-nirmaan-green/15">
              <span className="font-display text-2xl font-extrabold leading-none">25%</span>
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90">off</span>
              <span className="absolute right-3 top-3 text-3xl font-extrabold leading-none">*</span>
            </div>
            )}

            {/* Copy */}
            <div className="relative flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-nirmaan-brown px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                <GraduationCap className="size-3.5" /> {noTest ? 'Upgrade' : 'Bundle offer'}
              </span>
              <p className="mt-3 font-display text-xl font-extrabold leading-snug tracking-tight text-nirmaan-brown sm:text-2xl">
                {noTest
                  ? <>Add the test to your <span className="text-nirmaan-green">Nirmaan</span> plan — pay only the difference</>
                  : <>Club it with <span className="text-nirmaan-green">Nirmaan</span> &amp; get a flat 25% discount</>}
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
              {noTest ? 'See upgrade options' : 'View Nirmaan Plans'} <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
      )}

      {/* ---- Section 8 · FAQs (from the FAQs doc) ---- */}
      <Faqs />
    </div>
  )
}
