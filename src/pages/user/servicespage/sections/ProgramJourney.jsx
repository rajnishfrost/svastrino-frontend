import { useLayoutEffect, useRef, useState } from 'react'
import { Compass, MessageSquare, ClipboardCheck, Rocket, Trophy, Flag } from 'lucide-react'
import './ProgramJourney.css'

/**
 * Programme page · the journey, stage by stage — the home page's "Your Journey"
 * look (white cards, a winding gradient road, icon-badge nodes), but DYNAMIC:
 * the road is drawn through the real badge positions (measured after layout and
 * re-measured on resize), so it zig-zags correctly for any number of stages and
 * any length of copy. The inclusions box sits at the foot.
 */

// Milestone icons + node gradients cycle across however many stages there are.
const STAGE_ICONS = [Compass, MessageSquare, ClipboardCheck, Rocket, Trophy, Flag]
const STAGE_GRADS = [
  ['#c8102e', '#a30c25'],
  ['#2f7ae5', '#1c5fc4'],
  ['#0f2c5c', '#0a1f43'],
]

// Build one smooth path that weaves vertically through the measured node points.
function roadPath(points) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    const my = (a.y + b.y) / 2
    d += ` C ${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}`
  }
  return d
}

export default function ProgramJourney({ program }) {
  const stages = program.journey || []
  const wrapRef = useRef(null)
  const badgeRefs = useRef([])
  const [road, setRoad] = useState({ d: '', w: 0, h: 0 })

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const measure = () => {
      const wrapRect = wrap.getBoundingClientRect()
      const points = badgeRefs.current.filter(Boolean).map((el) => {
        const r = el.getBoundingClientRect()
        return {
          x: r.left - wrapRect.left + r.width / 2,
          y: r.top - wrapRect.top + r.height / 2,
        }
      })
      setRoad({ d: roadPath(points), w: wrapRect.width, h: wrapRect.height })
    }
    measure()
    // Re-measure whenever the layout reflows (resize, font swap, image load…).
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [stages.length])

  if (!stages.length) return null

  return (
    <div>
      <div className="text-center">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-brand-navy">Program journey</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-brand-slate">
          What actually happens, stage by stage — from the moment you book to the follow-up after the
          last session.
        </p>
      </div>

      <div className="pj-road" ref={wrapRef}>
        {/* The winding road, drawn through the measured badge centres. */}
        {road.d && road.w > 0 && (
          <svg
            className="pj-road-svg"
            width={road.w}
            height={road.h}
            viewBox={`0 0 ${road.w} ${road.h}`}
            aria-hidden
          >
            <defs>
              <linearGradient id="pj-road-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c8102e" />
                <stop offset="50%" stopColor="#2f7ae5" />
                <stop offset="100%" stopColor="#0f2c5c" />
              </linearGradient>
            </defs>
            <path d={road.d} fill="none" stroke="#0f2c5c" strokeOpacity="0.06" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
            <path d={road.d} fill="none" stroke="url(#pj-road-grad)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}

        {stages.map((s, i) => {
          const Icon = STAGE_ICONS[i % STAGE_ICONS.length]
          const grad = STAGE_GRADS[i % STAGE_GRADS.length]
          const side = i % 2 === 0 ? 'pj-step--left' : 'pj-step--right'
          return (
            <div key={i} className={`pj-step ${side}`}>
              <span
                className="pj-badge"
                ref={(el) => { badgeRefs.current[i] = el }}
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`,
                  border: '3px solid #fff',
                  boxShadow: '0 8px 18px -6px rgba(15, 44, 92, 0.5)',
                }}
              >
                <Icon size={20} color="#ffffff" strokeWidth={2.2} />
              </span>
              <div className="pj-card">
                {s.label && <div className="pj-label">{s.label}</div>}
                <div className="pj-title">{s.title}</div>
                {s.description && <p className="pj-desc">{s.description}</p>}
              </div>
            </div>
          )
        })}
      </div>

      {/* What the programme includes */}
      <div className="mt-8 rounded-2xl border border-brand-navy/10 bg-brand-cream p-5">
        <h3 className="font-display text-base font-bold text-brand-navy">What the programme includes</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {program.duration && (
            <li className="flex justify-between gap-3"><strong className="font-semibold text-brand-navy">Total duration</strong><span className="text-brand-slate">{program.duration}</span></li>
          )}
          {program.sessions && (
            <li className="flex justify-between gap-3"><strong className="font-semibold text-brand-navy">Sessions</strong><span className="text-brand-slate">{program.sessions}</span></li>
          )}
          {program.mode && (
            <li className="flex justify-between gap-3"><strong className="font-semibold text-brand-navy">Delivered</strong><span className="text-brand-slate">{program.mode}</span></li>
          )}
        </ul>
        {program.brochureUrl && (
          <a
            href={program.brochureUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-brand-navy/15 bg-white px-5 text-sm font-semibold text-brand-navy transition-colors hover:text-brand-crimson"
          >
            Download brochure (PDF)
          </a>
        )}
      </div>
    </div>
  )
}
