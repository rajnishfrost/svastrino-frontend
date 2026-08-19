// Reusable inline-SVG icon set — 24x24 grid, 2px stroke, uses currentColor
// so a single CSS rule (.nirmaan-benefit-icon { color: … }) themes them all.
const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

function CompassIcon() {
  // Psychometric assessment — compass (direction/measurement)
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <polygon points="15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5 15.5 8.5" />
    </svg>
  )
}

function ReportIcon() {
  // Personalised report — document with lines + play badge (video explanation)
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
  // Career roadmap — a route with two waypoint pins
  return (
    <svg {...iconProps}>
      <path d="M6 5v6a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v2" />
      <circle cx="6" cy="4" r="2" />
      <circle cx="18" cy="20" r="2" />
    </svg>
  )
}

function MentorIcon() {
  // Mentoring & community — two people
  return (
    <svg {...iconProps}>
      <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" />
      <circle cx="10" cy="8" r="3.2" />
      <path d="M20 20v-1.5a3.5 3.5 0 0 0-2.6-3.38" />
      <path d="M15 5.2a3.2 3.2 0 0 1 0 5.6" />
    </svg>
  )
}

// Benefits = "what you get" — every point maps to an SRS feature.
const BENEFITS = [
  { Icon: CompassIcon, title: 'Self-Awareness',
    text: 'Understand your strengths, interests, emotions & overall life.' },
  { Icon: ReportIcon, title: 'Confidence',
    text: 'Develop confidence through small actions rather than motivation.' },
  { Icon: RoadmapIcon, title: 'Mindset',
    text: 'Learn to handle & evolve from failure, fear, criticism & uncertainty.' },
  { Icon: MentorIcon, title: 'Personal Growth',
    text: 'Build awareness, discipline, focus, and habits.' },
  { Icon: CompassIcon, title: 'Academic Development',
    text: 'Ask questions, handle setbacks & improve performance.' },
  { Icon: RoadmapIcon, title: 'Career Readiness',
    text: 'Explore options & pick the one you dream & desire.' },
]

/** The specific changes the programme sets out to produce. */
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
    <section className="section section--alt">
      <div className="container text-center">
        <p className="section-eyebrow">What you get</p>
        <h2 className="section-title">Why Choose the Nirmaan Course</h2>
        <p className="section-sub">Overall benefits of the process.</p>
        <div className="grid grid-3 nirmaan-benefits">
          {BENEFITS.map(({ Icon, title, text }) => (
            <div key={title} className="card nirmaan-benefit">
              <span className="nirmaan-benefit-icon" aria-hidden>
                <Icon />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>

        <div className="nirmaan-devs">
          <h3>Specific developments of the programme</h3>
          <ul>{DEVELOPMENTS.map((d) => <li key={d}>{d}</li>)}</ul>
        </div>

        <p className="nirmaan-transformation">
          From “I don’t know if I can” → “I know myself, I can learn, I can adapt, and I
          know what I can do next.”
        </p>
      </div>
    </section>
  )
}
