import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'
import ProgramEmblem from '../../../../common_component/user/ProgramEmblem/ProgramEmblem.jsx'

/**
 * Home · section 3 — "Our Services".
 * The routing block. Rather than listing products, it lists what the visitor
 * might be feeling and sends each one to the service that answers it. The last
 * two cards are Skill-Build products and carry the Nirmaan green.
 */
const SERVICES = [
  {
    need: 'I need Immediate Career Counselling and Clarity',
    who: 'For individuals who want to make a confident stream & career choice',
    points: [
      "Resolve Last-Minute Career Confusion",
      "Verify Your Career Choice Before Committing",
      "Explore Relevant Career Paths & Opportunities",
      "Make a Confident & Informed Career Decision",
    ],
    duration: '10 Days',
    cta: "Explore Bull's Eye",
    to: '/services/bulls-eye',
    accent: 'crimson',
  },
  {
    need: 'I want to choose my career through Deep Self-Reflection',
    who: 'For individuals who want career clarity through self-reflection',
    points: [
      "Explore Your Potential & Talents",
      "Create & Better Your Vision",
      "Explore Unique & Futuristic Careers",
      "Decide What Suits Your Personality & Needs",
      "Build a Clear 5-year Career Plan",
    ],
    duration: '2 Months',
    cta: 'Explore Bloom',
    to: '/services/bloom',
    accent: 'blue',
  },
  {
    need: 'I want Long-Term Mentoring and Complete Transformation',
    who: 'For individuals who want to grow into visionary leaders',
    points: [
      "Discover Natural & Hidden Talents",
      "Build Stronger Personality, Mindsets & Charisma",
      "Tailored Personalised Mentoring & Support",
      "Overall Life & Career Mentoring",
    ],
    duration: '2 Years',
    cta: 'Explore Breakthrough',
    to: '/services/breakthrough',
    accent: 'navy',
  },
  {
    need: 'I want to build my Skills and Myself',
    who: 'For teens, freshers & young professionals who want to become future-ready',
    points: [
      "Build Deep Self-Awareness & Self-Control",
      "Strengthen Discipline, Confidence & Communication",
      "Develop Mindsets & Skills for Life & Career",
      "Turn Learning Into Real-World Experience",
    ],
    duration: '6 Months',
    cta: 'Explore Nirmaan',
    to: '/skill-build/nirmaan',
    skillBuild: true,
    accent: 'green',
  },
  {
    need: 'I want a Scientifically Analysis to decide my Career',
    who: 'For individuals who want to to verify their potential & career options scientifically',
    points: [
      "Know Yourself Like Never Before",
      "Discover Suitable, Streams, Careers & Directions",
      "Reduce Confusion, Pressure & Assumption",
      "Decide Your Personal Journey Confidently",
    ],
    duration: '1 Day',
    cta: 'Explore Psychometric Testing',
    to: '/skill-build/psychometric-testing',
    skillBuild: true,
    accent: 'green',
  },
]

// Each mentoring program gets its own on-brand accent so the row reads as
// three distinct paths rather than one repeated colour; the two Skill-Build
// products keep the Nirmaan green.
const ACCENTS = {
  crimson: {
    text: 'text-brand-crimson',
    chip: 'bg-brand-crimson/10',
    bullet: 'bg-brand-rose',
    btn: 'bg-brand-crimson text-white hover:bg-brand-crimson-dark',
  },
  blue: {
    text: 'text-brand-blue',
    chip: 'bg-brand-blue/10',
    bullet: 'bg-brand-blue-light',
    btn: 'bg-brand-blue text-white hover:bg-brand-blue-dark',
  },
  navy: {
    text: 'text-brand-navy',
    chip: 'bg-brand-navy/10',
    bullet: 'bg-brand-navy/10',
    btn: 'bg-brand-navy text-white hover:bg-brand-navy-dark',
  },
  // Nirmaan sub-brand = green accent/action + brown text (its two brand colours,
  // never navy). So the green card carries brown body text, not the navy the
  // Svastrino cards use.
  green: {
    text: 'text-nirmaan-green',
    chip: 'bg-nirmaan-green/10',
    bullet: 'bg-nirmaan-green/15',
    btn: 'bg-nirmaan-green text-white hover:bg-nirmaan-green-dark',
    body: 'text-nirmaan-brown',
  },
}

function ServiceCard({ s }) {
  const c = ACCENTS[s.accent] || ACCENTS.crimson
  const accentText = c.text
  const chipBg = c.chip
  const bulletBg = c.bullet
  const btn = c.btn
  // Heading + bullet-label colour: navy for Svastrino cards, brown for Nirmaan.
  const bodyText = c.body || 'text-brand-navy'
  return (
    <div className="relative flex flex-col rounded-xl border border-brand-navy/5 bg-white p-6 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-navy/5">
      <span className={`absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-xs font-semibold ${chipBg} ${accentText}`}>
        {s.duration}
      </span>

      <span className={`flex size-11 items-center justify-center rounded-xl p-2 ${chipBg} ${accentText}`}>
        <ProgramEmblem variant={s.to.split('/').pop()} />
      </span>

      <h3 className={`mt-4 pr-16 font-display text-base font-bold leading-snug ${bodyText}`}>{s.need}</h3>
      <p className="mt-2 text-sm text-brand-slate">{s.who}</p>

      <ul className="mt-5 flex-1 space-y-2.5">
        {s.points.map((pt) => (
          <li key={pt} className={`flex items-start gap-2 text-sm ${bodyText}`}>
            <span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${bulletBg}`}>
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
}

export default function OurServices() {
  // Row 1 = the crimson career/mentoring programs; row 2 = the green Skill-Build
  // products. Split so each colour group fills its own full-width row.
  const mentoring = SERVICES.filter((s) => !s.skillBuild)
  const skillBuild = SERVICES.filter((s) => s.skillBuild)

  return (
    <section className="bg-soft py-20 md:py-24">
      <div className="container">
        <SectionHeading
          title="Let's first understand why you are here!"
          subtitle="We know that not every student needs the same kind of career guidance. Whatever stage you're at, we have a solution for it."
        />

        <div className="mt-14 space-y-6">
          {/* Row 1 — mentoring programs (crimson), 3 across */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mentoring.map((s) => <ServiceCard key={s.to} s={s} />)}
          </div>
          {/* Row 2 — Skill-Build products (green), 2 across */}
          <div className="grid gap-6 sm:grid-cols-2">
            {skillBuild.map((s) => <ServiceCard key={s.to} s={s} />)}
          </div>
        </div>
      </div>
    </section>
  )
}
