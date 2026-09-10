import { useLayoutEffect, useRef, useState } from 'react'
import { ClipboardCheck, MessageSquare, Compass, Rocket } from 'lucide-react'

/**
 * Psychometric · "Student Journey" — the four steps a student takes.
 * On desktop the steps lay out as a HORIZONTAL timeline (matching the home
 * page's "Your Journey" section): green icon badges (the nodes) alternate
 * up/down while their cards zig-zag above and below, and a single gradient road
 * is drawn through the *measured* badge centres (re-measured on resize) so it
 * weaves smoothly for any copy length. On mobile the same road straightens into
 * a vertical left-rail timeline. Green/brown palette to match the rest of the
 * page.
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

function StepCard({ step, className = '' }) {
  return (
    <div className={`rounded-2xl border border-nirmaan-sand bg-white p-5 shadow-sm ${className}`}>
      <h3 className="font-display text-base font-bold text-nirmaan-brown">{step.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-nirmaan-brown-soft">{step.text}</p>
    </div>
  )
}

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
    <section className="overflow-hidden bg-white py-16 md:py-20">
      <div className="container">
        <h2 className="text-center font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown sm:text-4xl">
          Student Journey
        </h2>

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
                <linearGradient id="psy-road" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3f7932" />
                  <stop offset="50%" stopColor="#5a9a4d" />
                  <stop offset="100%" stopColor="#90743c" />
                </linearGradient>
              </defs>
              {/* soft under-shadow gives the road some body */}
              <path d={road.d} fill="none" stroke="#3b2822" strokeOpacity="0.06" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
              <path d={road.d} fill="none" stroke="url(#psy-road)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}

          <ol className="relative grid h-full grid-cols-4 gap-x-6">
            {STEPS.map((s, i) => {
              // Even steps: card on top, badge below it (upper band of the road).
              // Odd steps: badge above the card (lower band). → a clean zig-zag.
              const top = i % 2 === 0
              return (
                <li
                  key={s.title}
                  className={`flex h-full flex-col items-center ${top ? 'justify-start' : 'justify-end'}`}
                >
                  {top && <StepCard step={s} className="w-full text-center" />}
                  <span
                    ref={(el) => { badgeRefs.current[i] = el }}
                    className="relative z-10 my-4 shrink-0"
                  >
                    <Badge Icon={s.Icon} size={56} />
                  </span>
                  {!top && <StepCard step={s} className="w-full text-center" />}
                </li>
              )
            })}
          </ol>
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
              <StepCard step={s} className="mb-8 flex-1" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
