import { Compass, Lightbulb, Blocks, Rocket, TrendingUp } from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'

/**
 * Home · section 4 — "Your Journey in 5 Simple Steps".
 * A stylised serpentine "roadmap": each step keeps its own card, and a single
 * gradient road weaves down through bold icon badges (the nodes), so the
 * sequence reads as one connected journey rather than five loose items.
 *
 * The badges are styled inline (not via Tailwind): global.css ships a hard `*`
 * reset and this project pins an old lucide build, so inline geometry + explicit
 * icon `size`/`color` props are the reliable way to guarantee a crisp node.
 */
const STEPS = [
  { label: 'Discover', text: 'Know yourself, interests & potential', Icon: Compass, grad: ['#c8102e', '#a30c25'] },
  { label: 'Understand', text: 'Gain career clarity & direction', Icon: Lightbulb, grad: ['#2f7ae5', '#1c5fc4'] },
  { label: 'Build', text: 'Develop mindset, skills & profile', Icon: Blocks, grad: ['#0f2c5c', '#0a1f43'] },
  { label: 'Experience', text: 'Apply learning through real opportunities', Icon: Rocket, grad: ['#c8102e', '#a30c25'] },
  { label: 'Progress', text: 'Make confident decisions and progress towards success', Icon: TrendingUp, grad: ['#2f7ae5', '#1c5fc4'] },
]

// Node positions (percent of the desktop diagram box). The road weaves between
// x=42 and x=58; badges sit on those points and the SVG uses the same percentage
// space, so they stay aligned at any width. `side` picks the card side.
const NODES = [
  { x: 42, y: 10, side: 'left' },
  { x: 58, y: 30, side: 'right' },
  { x: 42, y: 50, side: 'left' },
  { x: 58, y: 70, side: 'right' },
  { x: 42, y: 90, side: 'left' },
]

// One continuous serpentine through the five nodes (smooth S-curves).
const ROAD =
  'M42,10 C42,20 58,20 58,30 C58,40 42,40 42,50 C42,60 58,60 58,70 C58,80 42,80 42,90'

function StepCard({ step, i, className = '' }) {
  return (
    <div className={`rounded-2xl bg-white p-5 shadow-xl shadow-brand-navy/5 ring-1 ring-brand-navy/5 ${className}`}>
      <h3 className="font-display text-base font-bold text-brand-navy">{i}. {step.label}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-brand-slate">{step.text}</p>
    </div>
  )
}

// The icon node that sits on the road — solid gradient disc, white halo, glow.
function Badge({ step, size = 66 }) {
  const { Icon, grad } = step
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
        background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`,
        border: '4px solid #fff',
        boxShadow: '0 12px 24px -10px rgba(15,44,92,0.5)',
      }}
    >
      <Icon size={Math.round(size * 0.46)} color="#ffffff" strokeWidth={2.25} />
    </span>
  )
}

export default function YourJourney() {
  return (
    <section className="overflow-hidden bg-white py-20 md:py-24">
      <div className="container">
        <SectionHeading title="Your Journey in 5 Simple Steps" />

        {/* Desktop: the serpentine road with alternating cards. */}
        <div className="relative mx-auto mt-12 hidden h-[760px] max-w-5xl lg:block">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            fill="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="journey-road" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c8102e" />
                <stop offset="50%" stopColor="#2f7ae5" />
                <stop offset="100%" stopColor="#0f2c5c" />
              </linearGradient>
            </defs>
            {/* soft under-shadow gives the road some body */}
            <path d={ROAD} stroke="#0f2c5c" strokeOpacity="0.06" strokeWidth="18" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <path d={ROAD} stroke="url(#journey-road)" strokeWidth="8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>

          {STEPS.map((s, i) => {
            const n = NODES[i]
            const cardStyle =
              n.side === 'left'
                ? { top: `${n.y}%`, left: '3%', right: '62%', transform: 'translateY(-50%)' }
                : { top: `${n.y}%`, left: '62%', right: '3%', transform: 'translateY(-50%)' }
            return (
              <div key={s.label}>
                <div className="absolute" style={cardStyle}>
                  <StepCard step={s} i={i+1} className={n.side === 'left' ? 'text-right' : 'text-left'} />
                </div>
                <div
                  className="absolute z-10"
                  style={{ top: `${n.y}%`, left: `${n.x}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <Badge step={s} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Mobile / tablet: the road straightens into a left-rail timeline. */}
        <ol className="mx-auto mt-12 max-w-md lg:hidden">
          {STEPS.map((s, i) => (
            <li key={s.label} className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <Badge step={s} size={56} />
                {i < STEPS.length - 1 && (
                  <span
                    className="my-1 flex-1"
                    style={{
                      width: 6,
                      borderRadius: 9999,
                      background: 'linear-gradient(#c8102e66, #2f7ae566, #0f2c5c66)',
                    }}
                  />
                )}
              </div>
              <StepCard step={s} i={i+1} className="mb-8 flex-1" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
