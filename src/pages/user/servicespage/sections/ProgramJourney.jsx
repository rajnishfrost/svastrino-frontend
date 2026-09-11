import { useLayoutEffect, useRef, useState } from 'react'
import { Check, Minus, Plus } from 'lucide-react'
import { PROGRAM_JOURNEYS_2 } from '../journeyStages.js'

/**
 * Program page · the journey, shown as ONE continuous timeline so it reads as a
 * single path from the first session to the last. Data comes from
 * PROGRAM_JOURNEYS_2 (the client's supplied copy): each stage carries a timing
 * line and either a plain list of points or a set of named steps; some stages
 * add a phase `note`, and the program adds `duration` and `inclusions`. A
 * program with no stage breakdown falls back to the flat backend journey.
 *
 * DESKTOP is the home page's "Your Journey" treatment, transposed to vertical:
 * gradient numbered nodes on a single SMOOTH road, cards zig-zagging left/right
 * of it. The road is drawn through the *measured* node centres and re-measured
 * on resize / expand, so it stays smooth for any card height. Because a program
 * can be long (Breakthrough is ~15 steps) the cards COLLAPSE — only the open one
 * shows its points, so the path stays short. MOBILE straightens the road into a
 * left-rail timeline.
 *
 * The stored copy is verbatim; the two `clean*` helpers only tidy it for display
 * (drop the wrapping parens on a timing line, and the redundant "- Stage N" from
 * a title, since each node is already numbered).
 */

// Backend flat journey → the stage shape, so an unknown program still renders.
function fromBackend(journey) {
  if (!journey?.length) return null
  return {
    stages: [
      {
        steps: journey.map((j) => ({
          title: j.title,
          points: j.description ? [j.description] : [],
        })),
      },
    ],
  }
}

const cleanTitle = (t) => (t || '').replace(/\s*[-–—]\s*Stage\s*\d+\s*$/i, '').trim()
const cleanRange = (r) => (r || '').replace(/^\s*\(\s*/, '').replace(/\s*\)\s*$/, '').trim()

// Some inclusion lists carry a bare connector line ("Or", "And") between two
// alternatives — it isn't an inclusion in its own right, so it renders as a
// muted separator rather than a ticked item.
const isConnector = (s) => /^(or|and|&|\+)$/i.test(String(s || '').trim())

// Node fills cycle down the page so the road reads as the same crimson→blue→navy
// sweep the home page uses.
const NODE_GRADS = [
  ['#c8102e', '#a30c25'],
  ['#2f7ae5', '#1c5fc4'],
  ['#0f2c5c', '#0a1f43'],
]

// One smooth path weaving VERTICALLY through the measured node centres: the
// control points share the midpoint Y, so the road eases top→bottom in gentle
// S-curves between the alternating left/right badges. (Home page's roadPath,
// transposed from horizontal to vertical.)
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

function ClockIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 1.5" />
    </svg>
  )
}

// The numbered disc that sits on the road — solid gradient, white halo, glow.
// Styled inline (not Tailwind): global.css ships a hard `*` reset, so inline
// geometry is the reliable way to guarantee a crisp node.
function Node({ n, i, size = 52 }) {
  const grad = NODE_GRADS[i % NODE_GRADS.length]
  return (
    <span
      className="font-display"
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
        color: '#fff',
        fontWeight: 800,
        fontSize: Math.round(size * 0.4),
        lineHeight: 1,
      }}
    >
      {n}
    </span>
  )
}

/** A roomy, readable list of "what happens" points. */
function Points({ points, className = '' }) {
  return (
    <ul className={`space-y-2.5 ${className}`}>
      {points.map((p) => (
        <li key={p} className="flex gap-3 text-[15px] leading-relaxed text-brand-slate">
          <span aria-hidden className="mt-[9px] size-1.5 shrink-0 rounded-full bg-brand-crimson/50" />
          <span>{p}</span>
        </li>
      ))}
    </ul>
  )
}

/** The expanded content of a stage: plain points and/or named sub-steps. */
function StageBody({ stage }) {
  const titled = stage.steps.filter((s) => s.title)
  const loose = stage.steps.filter((s) => !s.title).flatMap((s) => s.points)

  return (
    <>
      {/* A stage of plain points (pre / post session). */}
      {loose.length > 0 && <Points points={loose} />}

      {/* Named steps — plain blocks (a bold heading over its points). No box or
          rule: the stage card is the only card here, and boxing each step inside
          it just stacks a card in a card. */}
      {titled.length > 0 && (
        <div className={`space-y-5 ${loose.length > 0 ? 'mt-5' : ''}`}>
          {titled.map((step, i) => (
            <div key={i}>
              <h4 className="font-display text-[15px] font-bold text-brand-navy md:text-base">{step.title}</h4>
              <Points points={step.points} className="mt-2" />
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/**
 * The collapsible card for one stage — shared by the desktop timeline and the
 * mobile rail. The number lives on the road node, not in the header, so the two
 * layouts stay identical.
 */
function StageCard({ stage, n, total, isOpen, onToggle }) {
  const range = cleanRange(stage.range)
  const noteLines = stage.note ? stage.note.split('\n').map((l) => l.trim()).filter(Boolean) : []
  const heading = cleanTitle(stage.title) || (total > 1 ? `Stage ${n}` : 'What happens')

  return (
    <div
      className={`w-full rounded-2xl bg-white shadow-xl transition ${
        isOpen ? 'shadow-brand-navy/10 ring-1 ring-brand-navy/10' : 'shadow-brand-navy/5 ring-1 ring-brand-navy/5'
      }`}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-3 p-5 text-left rounded-2xl border-brand-crimson border"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-bold text-brand-navy">{heading}</span>
          {range && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-crimson/10 px-2.5 py-0.5 text-[13px] font-semibold text-brand-crimson">
              <ClockIcon className="shrink-0" /> {range}
            </span>
          )}
        </span>
        <span className="shrink-0 text-brand-crimson">
          {isOpen ? <Minus className="size-5" /> : <Plus className="size-5" />}
        </span>
      </button>

      {isOpen && (
        <div className="border-x-0 border-b-0 border-t border-solid border-brand-navy/10 px-5 pb-5 pt-4">
          {noteLines[0] && (
            <p className="mb-3 text-sm italic leading-relaxed text-brand-slate">{noteLines[0]}</p>
          )}
          <StageBody stage={stage} />
        </div>
      )}
    </div>
  )
}

export default function ProgramJourney({ program }) {
  const data = PROGRAM_JOURNEYS_2[program.slug] || fromBackend(program.journey)
  // First stage open, the rest collapsed. null = all closed.
  const [open, setOpen] = useState(0)
  const toggle = (i) => setOpen((cur) => (cur === i ? null : i))

  const wrapRef = useRef(null)
  const badgeRefs = useRef([])
  const [road, setRoad] = useState({ d: '', w: 0, h: 0 })

  const stages = data?.stages || []

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const measure = () => {
      const wr = wrap.getBoundingClientRect()
      // On mobile the desktop timeline is display:none → zero-size; skip it.
      if (wr.width === 0) return setRoad({ d: '', w: 0, h: 0 })
      const pts = badgeRefs.current.filter(Boolean).map((el) => {
        const r = el.getBoundingClientRect()
        return { x: r.left - wr.left + r.width / 2, y: r.top - wr.top + r.height / 2 }
      })
      setRoad({ d: roadPath(pts), w: wr.width, h: wr.height })
    }
    measure()
    // Re-measure whenever the layout reflows — a card expanding, a resize, fonts.
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [open, stages.length])

  if (!data) return null
  const inclusions = data.inclusions || []

  return (
    <section className="bg-soft py-14 md:py-16">
      <div className="container mx-auto max-w-4xl">
        {/* Heading */}
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-crimson">The journey</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
            Your Program Journey
          </h2>
          {data.subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-brand-slate">{data.subtitle}</p>
          )}
        </div>

        {/* DESKTOP — serpentine road, cards alternating left/right of it. */}
        <div ref={wrapRef} className="relative mx-auto mt-14 hidden max-w-4xl lg:block">
          {road.d && road.w > 0 && (
            <svg
              className="pointer-events-none absolute inset-0"
              width={road.w}
              height={road.h}
              viewBox={`0 0 ${road.w} ${road.h}`}
              aria-hidden
            >
              <defs>
                <linearGradient id="program-road" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c8102e" />
                  <stop offset="50%" stopColor="#2f7ae5" />
                  <stop offset="100%" stopColor="#0f2c5c" />
                </linearGradient>
              </defs>
              {/* soft under-shadow gives the road some body */}
              <path d={road.d} fill="none" stroke="#0f2c5c" strokeOpacity="0.06" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
              <path d={road.d} fill="none" stroke="url(#program-road)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}

          <ol className="relative space-y-8">
            {stages.map((stage, i) => {
              const left = i % 2 === 0
              return (
                <li key={i} className="grid grid-cols-2 gap-x-24">
                  <div className={left ? 'col-start-1 flex justify-end' : 'col-start-2 flex justify-start'}>
                    {/* The card, with the road node pinned to its INNER edge so the
                        node straddles the gutter the road runs down. */}
                    <div className="relative w-full">
                      <span
                        ref={(el) => { badgeRefs.current[i] = el }}
                        className={`absolute top-1/2 z-10 -translate-y-1/2 ${
                          left ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'
                        }`}
                      >
                        <Node n={i + 1} i={i} />
                      </span>
                      <StageCard stage={stage} n={i + 1} total={stages.length} isOpen={open === i} onToggle={() => toggle(i)} />
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        {/* MOBILE / TABLET — the road straightens into a left-rail timeline. */}
        <ol className="mt-12 space-y-5 lg:hidden">
          {stages.map((stage, i) => (
            <li key={i} className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <Node n={i + 1} i={i} size={44} />
                {i < stages.length - 1 && (
                  <span
                    aria-hidden
                    className="my-2 w-1 flex-1 rounded-full"
                    style={{ background: 'linear-gradient(#c8102e66, #2f7ae566, #0f2c5c66)' }}
                  />
                )}
              </div>
              <div className="flex-1 pb-1">
                <StageCard stage={stage} n={i + 1} total={stages.length} isOpen={open === i} onToggle={() => toggle(i)} />
              </div>
            </li>
          ))}
        </ol>

        {/* Closing line */}
        {data.closing && (
          <p className="mt-8 rounded-2xl border border-brand-crimson/15 bg-brand-crimson/5 p-6 text-center font-display text-base font-medium italic leading-relaxed text-brand-navy md:text-lg">
            {data.closing}
          </p>
        )}

        {/* What the program includes */}
        {(data.duration || inclusions.length > 0 || program.duration) && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-brand-navy">
            <div className="border-b border-white/10 bg-white/5 px-6 py-4 md:px-8">
              <h3 className="font-display text-lg font-bold text-white">What the Program Includes</h3>
            </div>
            <div className="grid items-start gap-6 p-6 sm:grid-cols-[200px_1fr] sm:gap-8 md:p-8">
              {/* Duration — a bordered stat card so the column reads as a deliberate
                  headline figure rather than a stray line with empty space beside it. */}
              {(data.duration || program.duration) && (
                <div className="rounded-xl border border-white/15 bg-white/5 p-4 whitespace-nowrap">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Total duration</p>
                  <p className="mt-1 font-display text-[20px] font-extrabold leading-tight text-white">{data.duration || program.duration}</p>
                </div>
              )}
              {inclusions.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Inclusions</p>
                  <ul className="mt-3 space-y-2.5">
                    {inclusions.map((line) =>
                      isConnector(line) ? (
                        <li key={line} className="ml-[30px] text-xs font-semibold uppercase tracking-wide text-white/40">{line}</li>
                      ) : (
                        <li key={line} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-white/80">
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-crimson">
                            <Check className="size-3 text-white" />
                          </span>
                          <span>{line}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              ) : (program.sessions || program.mode) ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Details</p>
                  <ul className="mt-3 space-y-2.5">
                    {program.sessions && (
                      <li className="flex items-start gap-2.5 text-[15px] leading-relaxed text-white/80">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-crimson">
                          <Check className="size-3 text-white" />
                        </span>
                        <span><strong className="font-semibold text-white">Sessions:</strong> {program.sessions}</span>
                      </li>
                    )}
                    {program.mode && (
                      <li className="flex items-start gap-2.5 text-[15px] leading-relaxed text-white/80">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-crimson">
                          <Check className="size-3 text-white" />
                        </span>
                        <span><strong className="font-semibold text-white">Delivered:</strong> {program.mode}</span>
                      </li>
                    )}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
