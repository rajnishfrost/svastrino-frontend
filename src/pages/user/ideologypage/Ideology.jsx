import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'

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
  { need: 'Choosing career through Deep Self-Reflection', label: 'Bloom Program', to: '/services/bloom' },
  { need: 'To Transform Completely through Long-Term Mentoring', label: 'Breakthrough Program', to: '/services/breakthrough' },
  { need: 'To Build Skills and Yourself', label: 'Nirmaan', to: '/skill-build/nirmaan' },
  { need: 'To verify your potential & career Scientifically', label: 'Psychometric Testing', to: '/skill-build/psychometric-testing' },
]

export default function Ideology() {
  return (
    <>
      <PageHero eyebrow="Our Ideology" title="Our Approach" />

      {/* ---- Five numbered pillars ---- */}
      <section className="bg-soft py-16 md:py-20">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p, i) => (
              <div
                key={p.title}
                className="relative overflow-hidden rounded-xl border border-brand-navy/5 bg-white p-7 shadow-sm"
              >
                <span
                  className="pointer-events-none absolute -right-1 -top-4 font-display text-7xl font-extrabold text-brand-crimson/10"
                  aria-hidden
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-display text-sm font-bold text-brand-crimson">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="mt-2 font-display text-lg font-bold text-brand-navy">{p.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-brand-slate">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Explore services strip ---- */}
      <section className="bg-white py-16 md:py-20">
        <div className="container">
          <h2 className="mx-auto max-w-2xl text-center font-display text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl">
            Now that you relate to our ideologies, let us help you explore our services
          </h2>
          <ul className="mx-auto mt-10 max-w-2xl divide-y divide-brand-navy/10">
            {SERVICES.map((r) => (
              <li key={r.to} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <span className="text-brand-navy">{r.need}</span>
                <Link
                  to={r.to}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-brand-crimson hover:underline"
                >
                  {r.label} <ArrowRight className="size-4" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
