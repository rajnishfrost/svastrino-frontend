import { ClipboardCheck, MessageSquare, Compass, Rocket } from 'lucide-react'

/**
 * Psychometric · "Student Journey" — the four steps a student takes, laid out
 * as a winding serpentine "road" (the look the mentoring program pages used):
 * a single gradient road weaves down through green icon badges, with the step
 * cards alternating left/right. On mobile it straightens into a left-rail
 * timeline. Green/brown palette to match the rest of the page.
 *
 * Badges are styled inline (geometry) + lucide size/color props — reliable
 * against the global reset and the pinned lucide build.
 */
const STEPS = [
  { title: 'Choose Your Test', text: 'Select the assessment based on your class and career stage.', Icon: ClipboardCheck },
  { title: 'Take the Assessment', text: 'Answer each question honestly; there are no right or wrong answers.', Icon: MessageSquare },
  { title: 'Understand Your Profile', text: 'Get clear insights into your interests, strengths, and suitable directions.', Icon: Compass },
  { title: 'Explore Your Options', text: 'Use your results to explore streams, subjects, and career paths with confidence.', Icon: Rocket },
]

// Node positions (percent of the desktop diagram box). The road weaves between
// x=42 and x=58; badges sit on those points and the SVG uses the same percentage
// space, so they stay aligned at any width. `side` picks the card side.
const NODES = [
  { x: 42, y: 13, side: 'left' },
  { x: 58, y: 38, side: 'right' },
  { x: 42, y: 63, side: 'left' },
  { x: 58, y: 88, side: 'right' },
]

// One continuous serpentine through the four nodes (smooth S-curves).
const ROAD = 'M42,13 C42,25 58,26 58,38 C58,50 42,51 42,63 C42,75 58,76 58,88'

function Badge({ Icon, size = 60 }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #5a9a4d, #3f7932)',
        border: '4px solid #fff',
        boxShadow: '0 12px 24px -10px rgba(59,40,34,0.45)',
      }}
    >
      <Icon size={Math.round(size * 0.42)} color="#ffffff" strokeWidth={2.15} />
    </span>
  )
}

export default function StudentJourney() {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="container">
        <h2 className="text-center font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown sm:text-4xl">
          Student Journey
        </h2>

        {/* Desktop: the serpentine road with alternating cards. */}
        <div className="relative mx-auto mt-10 hidden h-[620px] max-w-4xl lg:block">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            fill="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="psy-road" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3f7932" />
                <stop offset="50%" stopColor="#5a9a4d" />
                <stop offset="100%" stopColor="#90743c" />
              </linearGradient>
            </defs>
            <path d={ROAD} stroke="#3b2822" strokeOpacity="0.06" strokeWidth="18" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <path d={ROAD} stroke="url(#psy-road)" strokeWidth="8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>

          {STEPS.map((s, i) => {
            const n = NODES[i]
            const cardStyle =
              n.side === 'left'
                ? { top: `${n.y}%`, left: '3%', right: '60%', transform: 'translateY(-50%)' }
                : { top: `${n.y}%`, left: '60%', right: '3%', transform: 'translateY(-50%)' }
            return (
              <div key={s.title}>
                <div className="absolute" style={cardStyle}>
                  <div className={`rounded-2xl border border-nirmaan-sand bg-white p-5 shadow-sm ${n.side === 'left' ? 'text-right' : 'text-left'}`}>
                    <h3 className="font-display text-lg font-bold text-nirmaan-brown">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-nirmaan-brown-soft">{s.text}</p>
                  </div>
                </div>
                <div
                  className="absolute z-10"
                  style={{ top: `${n.y}%`, left: `${n.x}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <Badge Icon={s.Icon} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Mobile / tablet: the road straightens into a left-rail timeline. */}
        <ol className="mx-auto mt-12 max-w-md lg:hidden">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <Badge Icon={s.Icon} size={48} />
                {i < STEPS.length - 1 && (
                  <span className="my-1 w-1 flex-1 rounded-full" style={{ background: 'linear-gradient(#3f7932, #90743c)' }} />
                )}
              </div>
              <div className="mb-8 flex-1 rounded-2xl border border-nirmaan-sand bg-white p-5 shadow-sm">
                <h3 className="font-display text-base font-bold text-nirmaan-brown">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-nirmaan-brown-soft">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
