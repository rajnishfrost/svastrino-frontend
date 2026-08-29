import { useLayoutEffect, useRef, useState } from 'react'
import { Compass, Lightbulb, Blocks, Rocket, TrendingUp } from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'

/**
 * Home · section 4 — "Your Journey in 5 Simple Steps".
 * On desktop the five steps lay out as a HORIZONTAL timeline: bold icon badges
 * (the nodes) alternate up/down while their cards zig-zag above and below, and a
 * single gradient road is drawn through the *measured* badge centres (re-measured
 * on resize) so it weaves smoothly for any copy length. On mobile the same road
 * straightens into a vertical left-rail timeline.
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

// One smooth path weaving HORIZONTALLY through the measured node centres: the
// control points share the midpoint x, so the road eases left→right in gentle
// S-curves between the alternating up/down badges.
function roadPath(points) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    const mx = (a.x + b.x) / 2
    d += ` C ${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`
  }
  return d
}

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
  const wrapRef = useRef(null)
  const badgeRefs = useRef([])
  const [road, setRoad] = useState({ d: '', w: 0, h: 0 })

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const measure = () => {
      const wrapRect = wrap.getBoundingClientRect()
      // On mobile the desktop rail is display:none → zero-size; skip it.
      if (wrapRect.width === 0) return setRoad({ d: '', w: 0, h: 0 })
      const points = badgeRefs.current.filter(Boolean).map((el) => {
        const r = el.getBoundingClientRect()
        return { x: r.left - wrapRect.left + r.width / 2, y: r.top - wrapRect.top + r.height / 2 }
      })
      setRoad({ d: roadPath(points), w: wrapRect.width, h: wrapRect.height })
    }
    measure()
    // Re-measure whenever the layout reflows (resize, font swap, image load…).
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  return (
    <section className="overflow-hidden bg-white py-20 md:py-24">
      <div className="container">
        <SectionHeading title="Your Journey in 5 Simple Steps" />

        {/* Desktop: a horizontal timeline — nodes alternate up/down, cards
            zig-zag above/below, and the road is drawn through the badge centres. */}
        <div ref={wrapRef} className="relative mx-auto mt-10 hidden h-[460px] max-w-5xl lg:block">
          {road.d && road.w > 0 && (
            <svg
              className="pointer-events-none absolute inset-0"
              width={road.w}
              height={road.h}
              viewBox={`0 0 ${road.w} ${road.h}`}
              aria-hidden
            >
              <defs>
                <linearGradient id="journey-road" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#c8102e" />
                  <stop offset="50%" stopColor="#2f7ae5" />
                  <stop offset="100%" stopColor="#0f2c5c" />
                </linearGradient>
              </defs>
              {/* soft under-shadow gives the road some body */}
              <path d={road.d} fill="none" stroke="#0f2c5c" strokeOpacity="0.06" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
              <path d={road.d} fill="none" stroke="url(#journey-road)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}

          <ol className="relative grid h-full grid-cols-5 gap-x-6">
            {STEPS.map((s, i) => {
              // Even steps: card on top, badge below it (upper band of the road).
              // Odd steps: badge above the card (lower band). → a clean zig-zag.
              const top = i % 2 === 0
              return (
                <li
                  key={s.label}
                  className={`flex h-full flex-col items-center ${top ? 'justify-start' : 'justify-end'}`}
                >
                  {top && <StepCard step={s} i={i + 1} className="w-full text-center" />}
                  <span
                    ref={(el) => { badgeRefs.current[i] = el }}
                    className="relative z-10 my-4 shrink-0"
                  >
                    <Badge step={s} size={56} />
                  </span>
                  {!top && <StepCard step={s} i={i + 1} className="w-full text-center" />}
                </li>
              )
            })}
          </ol>
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
