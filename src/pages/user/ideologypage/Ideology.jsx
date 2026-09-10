import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import PageSeo from '../../../seo/PageSeo.jsx'
import ProgramHeroArt from '../servicespage/sections/ProgramHeroArt.jsx'

/**
 * Our Ideology — the five stages of how the mentoring is actually run here.
 * Content per src/content/our-ideology.md. (The spec notes these sit inside the
 * About page; kept as its own route for now since the nav/footer link to it.)
 */
const PILLARS = [
  {
    title: 'Understand Before You Choose',
    text: 'We believe informed career choices begin with truly understanding the individual first.',
  },
  {
    title: 'Develop Beyond Academics',
    text: 'We develop mindset, confidence, skills, and character alongside academic growth.',
  },
  {
    title: 'Learning Leads to Action',
    text: 'We turn knowledge into real experiences, purposeful habits and measurable growth.',
  },
  {
    title: 'Every Student Can Grow',
    text: 'With the right guidance, opportunities, effort and continuous learning, every student can grow.',
  },
  {
    title: 'Prepare for Life, Not Just Careers',
    text: 'We prepare students for the uncertainty and challenges that come with any path they choose.',
  },
]

const SERVICES = [
  { need: 'For Immediate Career Counselling', label: "Bull's Eye Program", to: '/services/bulls-eye' },
  { need: 'Choosing Career Through Deep Self-Reflection', label: 'Bloom Program', to: '/services/bloom' },
  { need: 'To Transform Completely Through Long-Term Mentoring', label: 'Breakthrough Program', to: '/services/breakthrough' },
  { need: 'To Build Skills And Yourself', label: 'Nirmaan', to: '/skill-build/nirmaan' },
  { need: 'To Verify Your Potential & Career Scientifically', label: 'Psychometric Testing', to: '/skill-build/psychometric-testing' },
]

export default function Ideology() {
  return (
    <>
      <PageSeo />
      <PageHero
        eyebrow=""
        title="Our Ideology"
        subtitle="The beliefs that guide how we understand, develop and prepare every student for life and career."
        illustration={<ProgramHeroArt src="/assets/images/approach.webp" alt="" />}
      />

      {/* ---- The five pillars — a zig-zag timeline ---- */}
      <section className="bg-soft py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
              Our Pillars
            </h2>
            <p className="mt-4 text-lg text-brand-slate">
              The five beliefs that shape how we guide every student.
            </p>
          </div>

          {/* Desktop: a straight horizontal timeline — numbered nodes left→right
              on one line, each pillar's title + text below its node. */}
          <div className="relative mx-auto mt-16 hidden max-w-5xl lg:block">
            <div
              className="absolute left-[10%] right-[10%] top-6 h-1 -translate-y-1/2 rounded-full bg-brand-crimson/25"
              aria-hidden
            />
            <ol className="relative grid grid-cols-5 gap-6">
              {PILLARS.map((p, i) => (
                <li key={p.title} className="flex flex-col items-center text-center">
                  <span className="relative z-10 flex size-12 items-center justify-center rounded-full border-4 border-white bg-brand-crimson font-display text-lg font-bold text-white shadow-md">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 font-display text-base font-bold text-brand-navy">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-slate">{p.text}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Mobile / tablet: a single left-rail timeline. */}
          <ol className="mx-auto mt-12 max-w-md lg:hidden">
            {PILLARS.map((p, i) => (
              <li key={p.title} className="relative flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-crimson font-display text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  {i < PILLARS.length - 1 && <span className="my-1 w-0.5 flex-1 rounded-full bg-brand-crimson/20" />}
                </div>
                <div className="mb-6 flex-1 rounded-xl border border-brand-navy/5 bg-white p-5 shadow-sm">
                  <h3 className="font-display text-base font-bold text-brand-navy">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-slate">{p.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---- Explore services strip ---- */}
      <section className="bg-white py-16 md:py-20">
        <div className="container">
          <h2 className="mx-auto max-w-2xl text-center font-display text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl">
            Now that you relate to our ideologies, let us help you explore our services
          </h2>
          <ul className="mx-auto mt-10 max-w-2xl divide-y divide-brand-navy/10">
            {SERVICES.map((r) => {
              // Skill-Build (Nirmaan) programs carry the Nirmaan green so they
              // read as a distinct sub-brand from the crimson Svastrino services.
              const isNirmaan = r.to.startsWith('/skill-build')
              return (
                <li key={r.to} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <span className={isNirmaan ? 'text-nirmaan-brown' : 'text-brand-navy'}>{r.need}</span>
                  <Link
                    to={r.to}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold hover:underline ${isNirmaan ? 'text-nirmaan-green' : 'text-brand-crimson'}`}
                  >
                    {r.label} <ArrowRight className="size-4" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </>
  )
}
