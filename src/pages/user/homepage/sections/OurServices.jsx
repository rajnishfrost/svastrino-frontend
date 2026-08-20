import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'

/**
 * Home · section 3 — "Our Services".
 * The routing block. Rather than listing products, it lists what the visitor
 * might be feeling and sends each one to the service that answers it. The last
 * two cards are Skill-Build products and carry the Nirmaan green.
 */
const SERVICES = [
  {
    need: 'I need Immediate Career Counselling and clarity',
    who: 'For individuals who want to make a confident stream & career choice',
    points: [
      'Resolve Last-Minute Career Confusion',
      'Verify Your Career Choice Before Committing',
      'Explore Relevant Career Paths & Opportunities',
      'Make a Confident & Informed Career Decision',
    ],
    duration: '10 Days',
    cta: "Explore Bull's Eye",
    to: '/services/bulls-eye',
  },
  {
    need: 'I want to choose my career through Deep Self-Reflection',
    who: 'For individuals who want career clarity through self-reflection',
    points: [
      'Explore your Potentials & Talents',
      'Create & Better your Vision',
      'Experiment Unique yet Futuristic Careers',
      'Decide what suits your personality & needs',
      'Build a clear 5-year Career Plan',
    ],
    duration: '2 Months',
    cta: 'Explore Bloom',
    to: '/services/bloom',
  },
  {
    need: 'I want Long-Term Mentoring and Complete Transformation',
    who: 'For individuals who want to grow into Visionary Leaders',
    points: [
      'Discover Natural & Hidden Talents',
      'Build Stronger Personality, Mindsets & Charisma',
      'Tailored Personalised Mentoring & Support',
      'Overall Life & Career Mentoring',
    ],
    duration: '2 Years',
    cta: 'Explore Breakthrough',
    to: '/services/breakthrough',
  },
  {
    need: 'I want to build my Skills and Myself',
    who: 'For teens, freshers & young professionals who want to become future-ready',
    points: [
      'Build Deep Self-Awareness & Self-Control',
      'Strengthen Discipline, Confidence & Communication',
      'Develop Mindsets & Skills for Life and Career',
      'Turn Learning Into Real-World Experience',
    ],
    duration: '6 months',
    cta: 'Nirmaan',
    to: '/skill-build/nirmaan',
    skillBuild: true,
  },
  {
    need: 'I want a Scientific Analysis to decide my Career',
    who: 'For individuals who want to verify their Potential & Career options Scientifically',
    points: [
      'Know yourself like never before',
      'Discover Suitable Streams, Careers & Directions',
      'Reduce confusion, pressure & assumption',
      'Decide your personal journey confidently',
    ],
    duration: '1 day',
    cta: 'Psychometric Testing',
    to: '/skill-build/psychometric-testing',
    skillBuild: true,
  },
]

export default function OurServices() {
  return (
    <section className="bg-soft py-20 md:py-24">
      <div className="container">
        <SectionHeading
          title="Let's first understand why you are here!"
          subtitle="We know that not every student needs the same kind of career guidance. Whatever stage you're at, we have a solution for it."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => {
            const accentText = s.skillBuild ? 'text-nirmaan-green' : 'text-brand-crimson'
            const chipBg = s.skillBuild ? 'bg-nirmaan-green/10' : 'bg-brand-crimson/10'
            const bulletBg = s.skillBuild ? 'bg-nirmaan-green/15' : 'bg-brand-rose'
            const btn = s.skillBuild
              ? 'bg-nirmaan-green text-white hover:bg-nirmaan-green-dark'
              : 'bg-brand-crimson text-white hover:bg-brand-crimson-dark'
            return (
              <div
                key={s.to}
                className="relative flex flex-col rounded-xl border border-brand-navy/5 bg-white p-6 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-navy/5"
              >
                <span
                  className={`absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-xs font-semibold ${chipBg} ${accentText}`}
                >
                  {s.duration}
                </span>

                <h3 className="mt-6 pr-16 font-display text-base font-bold leading-snug text-brand-navy">
                  {s.need}
                </h3>
                <p className="mt-2 text-sm text-brand-slate">{s.who}</p>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {s.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 text-sm text-brand-navy">
                      <span
                        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${bulletBg}`}
                      >
                        <Check className={`size-3 ${accentText}`} />
                      </span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={s.to}
                  className={`mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors ${btn}`}
                >
                  {s.cta} <ArrowRight className="size-4" />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
