import { PROGRAM_JOURNEYS_2 } from '../journeyStages.js'

/**
 * Program page · the journey, shown as ONE continuous timeline so it reads as a
 * single path from the first session to the last. Data comes from
 * PROGRAM_JOURNEYS_2 (the client's supplied copy): each stage carries a timing
 * line and either a plain list of points or a set of named steps; some stages
 * add a phase `note`, and the program adds `duration` and `inclusions`. A
 * program with no stage breakdown falls back to the flat backend journey.
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

function ClockIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 1.5" />
    </svg>
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

function Stage({ stage, n }) {
  const titled = stage.steps.filter((s) => s.title)
  const loose = stage.steps.filter((s) => !s.title).flatMap((s) => s.points)
  const noteLines = stage.note ? stage.note.split('\n').map((l) => l.trim()).filter(Boolean) : []
  const range = cleanRange(stage.range)

  return (
    <div className="rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm md:p-7">
      {/* Header — the numbered badge sits INLINE with the stage name (same flex
          row, vertically centred), so the two can never drift out of alignment. */}
      <div className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-crimson font-display text-base font-bold text-white shadow-md shadow-brand-crimson/25">
          {n}
        </span>
        {stage.title && (
          <h3 className="font-display text-xl font-bold text-brand-navy md:text-2xl">{cleanTitle(stage.title)}</h3>
        )}
      </div>

      {/* Timing chip + phase note */}
      {(range || noteLines[0]) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {range && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-crimson/10 px-3 py-1 text-sm font-semibold text-brand-crimson">
              <ClockIcon className="shrink-0" /> {range}
            </span>
          )}
          {noteLines[0] && (
            <span className="inline-flex rounded-full bg-brand-navy/5 px-3 py-1 text-sm font-semibold text-brand-navy">
              {noteLines[0]}
            </span>
          )}
        </div>
      )}
      {noteLines.slice(1).map((line, i) => (
        <p key={i} className="mt-2.5 max-w-prose text-sm italic leading-relaxed text-brand-slate">{line}</p>
      ))}

      {/* A stage of plain points (pre / post session). */}
      {loose.length > 0 && <Points points={loose} className="mt-5" />}

      {/* Named steps — each chunked into its own soft card so the eye can rest. */}
      {titled.length > 0 && (
        <div className="mt-5 space-y-3">
          {titled.map((step, i) => (
            <div key={i} className="rounded-xl bg-brand-cream/60 p-4 md:p-5">
              <h4 className="font-display text-base font-bold text-brand-navy md:text-[17px]">{step.title}</h4>
              <Points points={step.points} className="mt-2.5" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProgramJourney({ program }) {
  const data = PROGRAM_JOURNEYS_2[program.slug] || fromBackend(program.journey)
  if (!data) return null

  const inclusions = data.inclusions || []

  return (
    <section className="bg-white py-14 md:py-16">
      <div className="container mx-auto max-w-4xl">
      {/* Heading */}
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-crimson">The journey</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
          Your program journey
        </h2>
        {data.subtitle && (
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-brand-slate">{data.subtitle}</p>
        )}
      </div>

      {/* Stages */}
      <div className="mt-10 space-y-5 md:space-y-6">
        {data.stages.map((stage, i) => (
          <Stage key={i} stage={stage} n={i + 1} />
        ))}
      </div>

      {/* Closing line */}
      {data.closing && (
        <p className="mt-8 rounded-2xl border border-brand-crimson/15 bg-brand-crimson/5 p-6 text-center font-display text-base font-medium italic leading-relaxed text-brand-navy md:text-lg">
          {data.closing}
        </p>
      )}

      {/* What the program includes */}
      {(data.duration || inclusions.length > 0 || program.duration) && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-brand-navy/10 bg-brand-cream">
          <div className="border-b border-brand-navy/10 bg-white/60 px-6 py-4 md:px-8">
            <h3 className="font-display text-lg font-bold text-brand-navy">What the program includes</h3>
          </div>
          <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:gap-10 md:p-8">
            {(data.duration || program.duration) && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-crimson">Total duration</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-brand-navy">{data.duration || program.duration}</p>
              </div>
            )}
            {inclusions.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-crimson">Inclusions</p>
                <div className="mt-1.5 space-y-1 text-[15px] leading-relaxed text-brand-slate">
                  {inclusions.map((line) => <p key={line}>{line}</p>)}
                </div>
              </div>
            ) : (program.sessions || program.mode) ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-crimson">Details</p>
                <ul className="mt-1.5 space-y-1 text-[15px] text-brand-slate">
                  {program.sessions && <li><strong className="font-semibold text-brand-navy">Sessions:</strong> {program.sessions}</li>}
                  {program.mode && <li><strong className="font-semibold text-brand-navy">Delivered:</strong> {program.mode}</li>}
                </ul>
              </div>
            ) : null}
          </div>
          {program.brochureUrl && (
            <div className="px-6 pb-6 md:px-8">
              <a
                href={program.brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-brand-navy/15 bg-white px-5 text-sm font-semibold text-brand-navy transition-colors hover:text-brand-crimson"
              >
                Download brochure (PDF)
              </a>
            </div>
          )}
        </div>
      )}
      </div>
    </section>
  )
}
