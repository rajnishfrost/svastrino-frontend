import { Check } from 'lucide-react'

// Reusable inline-SVG icon set — 24x24 grid, 2px stroke, uses currentColor.
const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  className: 'size-7',
}

function CompassIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <polygon points="15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5 15.5 8.5" />
    </svg>
  )
}
function ReportIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <polyline points="14 3 14 8 19 8" />
      <line x1="8" y1="13" x2="14" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  )
}
function RoadmapIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6 5v6a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v2" />
      <circle cx="6" cy="4" r="2" />
      <circle cx="18" cy="20" r="2" />
    </svg>
  )
}
function MentorIcon() {
  return (
    <svg {...iconProps}>
      <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" />
      <circle cx="10" cy="8" r="3.2" />
      <path d="M20 20v-1.5a3.5 3.5 0 0 0-2.6-3.38" />
      <path d="M15 5.2a3.2 3.2 0 0 1 0 5.6" />
    </svg>
  )
}
function BookIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 7C10.4 5.6 8.4 5 6 5v12c2.4 0 4.4 0.6 6 2 1.6-1.4 3.6-2 6-2V5c-2.4 0-4.4 0.6-6 2z" />
      <line x1="12" y1="7" x2="12" y2="19" />
    </svg>
  )
}
function BriefcaseIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="7.5" width="18" height="12.5" rx="2" />
      <path d="M8.5 7.5V5.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" />
      <line x1="3" y1="12.5" x2="21" y2="12.5" />
    </svg>
  )
}

const BENEFITS = [
  { Icon: CompassIcon, title: 'Self-Awareness', text: 'Understand your strengths, interests, emotions & overall life.' },
  { Icon: ReportIcon, title: 'Confidence', text: 'Develop confidence through small actions rather than motivation.' },
  { Icon: RoadmapIcon, title: 'Mindset', text: 'Learn to handle & evolve from failure, fear, criticism & uncertainty.' },
  { Icon: MentorIcon, title: 'Personal Growth', text: 'Build awareness, discipline, focus, and habits.' },
  { Icon: BookIcon, title: 'Academic Development', text: 'Ask questions, handle setbacks & improve performance.' },
  { Icon: BriefcaseIcon, title: 'Career Readiness', text: 'Explore options & pick the one you dream & desire.' },
]

const DEVELOPMENTS = [
  'Understand your strengths, potential, and the person you want to become',
  'Develop the confidence to take on challenges and trust your ability to grow',
  'Build the courage to ask, try, explore, and step out of your comfort zone',
  'Learn from failures, improve, and try again with greater resilience',
  'Build discipline, focus, and consistency through daily actions',
  'Challenge limiting beliefs, embrace new ideas, and adapt to change',
  'Understand your emotions, respond calmly, and manage pressure effectively',
  'Explore career paths beyond traditional and familiar choices',
  'Learn to take greater ownership of your future',
  'See yourself as capable of creating a meaningful future',
]

export default function Benefits() {
  return (
    <section className="bg-nirmaan-cream/50 py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-nirmaan-green">What you get</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown sm:text-4xl">
            Why Choose the Nirmaan Course
          </h2>
          <p className="mt-4 text-lg text-nirmaan-brown-soft">Overall benefits of the process.</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-nirmaan-sand bg-white p-7 shadow-sm">
              <span className="flex size-12 items-center justify-center rounded-xl bg-nirmaan-green/10 text-nirmaan-green">
                <Icon />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold text-nirmaan-brown">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-nirmaan-brown-soft">{text}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-nirmaan-sand bg-white p-8">
          <h3 className="capitalize font-display text-xl font-bold text-nirmaan-brown">
            Specific developments of the Course
          </h3>
          <ul className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {DEVELOPMENTS.map((d) => (
              <li key={d} className="flex items-start gap-2.5 text-sm text-nirmaan-brown">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-nirmaan-green">
                  <Check className="size-3 text-white" />
                </span>
                {d}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </section>
  )
}
