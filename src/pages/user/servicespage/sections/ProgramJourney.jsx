import { useLayoutEffect, useRef, useState } from 'react'
import {
  Check, Search, Compass, ListChecks, Brain, Sparkles,
  Route, Rocket, TrendingUp, Handshake, BadgeCheck, Flag, Star, Heart,
} from 'lucide-react'
import { PROGRAM_JOURNEYS_2 } from '../journeyStages.js'

/**
 * Program page · the journey, shown as ONE continuous timeline that reads as a
 * single path from the first session to the last. Data comes from
 * PROGRAM_JOURNEYS_2 (the client's supplied copy): each stage carries a timing
 * line and either a plain list of points or a set of named steps; some stages
 * add a phase `note`, and the program adds `duration` and `inclusions`. A
 * program with no stage breakdown falls back to the flat backend journey.
 *
 * LAYOUT: a stage is now just a HEADING row (its title + timing, with any note
 * beneath) — the card is the STEP. Every step renders open (no accordion): the
 * whole journey is visible at once, its step cards alternating left / right of a
 * single SMOOTH road. The road (home page's "Your Journey" treatment, transposed
 * to vertical) is drawn through the *measured* node centres and re-measured on
 * resize, so it stays smooth for any card height. Each node carries an ICON
 * (cycled from PALETTE) rather than a number. MOBILE straightens the road into a
 * left-rail timeline.
 *
 * The stored copy is verbatim; the two `clean*` helpers only tidy it for display
 * (drop the wrapping parens on a timing line, and the redundant "- Stage N" from
 * a title, since the stage heading already labels the group).
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

// One icon per step, cycled down the journey. Ordered so a program reads as a
// natural arc (analyse → orient → practise → apply → progress); a program with
// more steps than icons simply wraps around.
const PALETTE = [
  Search, Compass, ListChecks, Brain, Sparkles, Route,
  Rocket, TrendingUp, Handshake, BadgeCheck, Flag, Star, Heart,
]

// One smooth path weaving VERTICALLY through the measured node centres: the
// control points share the midpoint Y, so the road eases top→bottom in gentle
// S-curves between the alternating left/right nodes. (Home page's roadPath,
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

// The disc that sits on the road — solid gradient, white halo, glow, with the
// step's icon inside. Styled inline (not Tailwind): global.css ships a hard `*`
// reset and this project pins an old lucide build, so inline geometry + explicit
// icon size/color props are the reliable way to guarantee a crisp node.
function Node({ Icon, i, size = 52 }) {
  const grad = NODE_GRADS[i % NODE_GRADS.length]
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
      <Icon size={Math.round(size * 0.42)} color="#ffffff" strokeWidth={2.15} />
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

/**
 * One step of the journey, as an always-open card: an optional step heading over
 * its points. Untitled steps (pre / post session) render as a plain point list —
 * the stage heading above already labels them.
 */
function StepCard({ step }) {
  return (
    <div className="w-full rounded-2xl bg-white p-5 shadow-xl shadow-brand-navy/5 ring-1 ring-brand-navy/10">
      {step.title && (
        <h4 className="font-display text-[15px] font-bold text-brand-navy md:text-base">{step.title}</h4>
      )}
      <Points points={step.points} className={step.title ? 'mt-2' : ''} />
    </div>
  )
}

/**
 * A stage label: its (cleaned) title on the left, timing pill on the right, and
 * any note beneath. It carries no node — the nodes belong to the step cards that
 * follow it. `pr` reserves the right lane the road runs down so the pill never
 * collides with it.
 */
function StageHeading({ title, range, note }) {
  const noteLines = note ? note.split('\n').map((l) => l.trim()).filter(Boolean) : []
  return (
    <div className="lg:pr-16">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3 className="font-display text-xl font-bold text-brand-navy">{title}</h3>
        {range && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-crimson/10 px-3 py-1 text-[13px] font-semibold text-brand-crimson">
            <ClockIcon className="shrink-0" /> {range}
          </span>
        )}
      </div>
      {noteLines[0] && (
        <p className="mt-2 text-sm italic leading-relaxed text-brand-slate">{noteLines[0]}</p>
      )}
    </div>
  )
}

export default function ProgramJourney({ program }) {
  const data = PROGRAM_JOURNEYS_2[program.slug] || fromBackend(program.journey)

  const wrapRef = useRef(null)
  const badgeRefs = useRef([])
  const [road, setRoad] = useState({ d: '', w: 0, h: 0 })

  const stages = data?.stages || []

  // Flatten the stages into a single top-to-bottom list of rows — a `stage`
  // heading followed by its `card` steps — while numbering the cards
  // continuously (ci) so the road, alternation and icons run unbroken across
  // stage boundaries.
  const rows = []
  let ci = 0
  stages.forEach((stage, si) => {
    rows.push({
      kind: 'stage',
      title: cleanTitle(stage.title) || (stages.length > 1 ? `Stage ${si + 1}` : 'What happens'),
      range: cleanRange(stage.range),
      note: stage.note,
    })
    stage.steps.forEach((step) => {
      rows.push({ kind: 'card', ci, step })
      ci++
    })
  })
  const cardCount = ci

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
    // Re-measure whenever the layout reflows — a resize, fonts, a program swap.
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [program.slug, cardCount])

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

        {/* DESKTOP — stage headings interleaved with step cards that alternate
            left / right of one smooth road. `pr-7` reserves room so a right-hand
            node isn't clipped where its card sits flush to the track edge. */}
        <div ref={wrapRef} className="relative mx-auto mt-14 hidden max-w-4xl pr-7 lg:block">
          {road.d && road.w > 0 && (
            <svg
              className="pointer-events-none absolute inset-0 z-10"
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

          <ul className="relative">
            {rows.map((row, i) =>
              row.kind === 'stage' ? (
                <li key={i} className="mt-12 first:mt-0">
                  <StageHeading title={row.title} range={row.range} note={row.note} />
                </li>
              ) : (
                <li key={i} className="mt-6 flex">
                  {/* Even cards sit flush-left; odd cards shift right (ml-auto),
                      swinging their right-edge node across the track so the road
                      weaves. The node straddles the card's inner-right corner. */}
                  <div className={`relative w-[80%] ${row.ci % 2 === 0 ? '' : 'ml-auto'}`}>
                    <span
                      ref={(el) => { badgeRefs.current[row.ci] = el }}
                      className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1/2"
                    >
                      <Node Icon={PALETTE[row.ci % PALETTE.length]} i={row.ci} />
                    </span>
                    <StepCard step={row.step} />
                  </div>
                </li>
              )
            )}
          </ul>
        </div>

        {/* MOBILE / TABLET — the road straightens into a left-rail timeline. The
            rail connects consecutive cards; it breaks at a stage heading. */}
        <ul className="mt-12 space-y-5 lg:hidden">
          {rows.map((row, i) =>
            row.kind === 'stage' ? (
              <li key={i} className={i === 0 ? '' : 'pt-3'}>
                <StageHeading title={row.title} range={row.range} note={row.note} />
              </li>
            ) : (
              <li key={i} className="relative flex gap-4">
                <div className="flex flex-col items-center">
                  <Node Icon={PALETTE[row.ci % PALETTE.length]} i={row.ci} size={44} />
                  {/* Continue the rail only while the next row is another card. */}
                  {rows[i + 1]?.kind === 'card' && (
                    <span
                      aria-hidden
                      className="my-2 w-1 flex-1 rounded-full"
                      style={{ background: 'linear-gradient(#c8102e66, #2f7ae566, #0f2c5c66)' }}
                    />
                  )}
                </div>
                <div className="flex-1 pb-1">
                  <StepCard step={row.step} />
                </div>
              </li>
            )
          )}
        </ul>

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
