import { PROGRAM_JOURNEYS } from '../journeyStages.js'

/**
 * Program page · the journey, CLUBBED BY STAGE. Each program's stages come
 * from its content sheet (src/content/<slug>.md → "Program Journey"): a stage
 * carries a time range and a set of steps, and each step lists what happens in
 * it. Programs without a stage breakdown fall back to the flat backend
 * journey, rendered as a single unlabelled group. The inclusions box sits at
 * the foot, as before.
 */

// Backend flat journey → the stage shape, so an unknown program still renders.
function fromBackend(journey) {
  if (!journey?.length) return null
  return {
    stages: [
      {
        steps: journey.map((j) => ({
          title: j.title,
          range: j.label,
          points: j.description ? [j.description] : [],
        })),
      },
    ],
  }
}

function Points({ points }) {
  return (
    <ul className="mt-1.5 space-y-1 text-sm leading-relaxed text-brand-slate">
      {points.map((p) => (
        <li key={p} className="flex gap-2">
          <span aria-hidden className="mt-[7px] size-1 shrink-0 rounded-full bg-brand-crimson/60" />
          <span>{p}</span>
        </li>
      ))}
    </ul>
  )
}

function Stage({ stage, n }) {
  const titled = stage.steps.filter((s) => s.title)
  const loose = stage.steps.filter((s) => !s.title).flatMap((s) => s.points)

  return (
    <div className="rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm md:p-7">
      {stage.title && (
        <div className="flex flex-wrap items-center gap-3 border-b border-brand-navy/10 pb-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-crimson font-display text-sm font-bold text-white">
            {n}
          </span>
          <h3 className="font-display text-lg font-bold text-brand-navy">{stage.title}</h3>
          {stage.range && (
            <span className="ml-auto rounded-full bg-brand-crimson/10 px-3 py-1 text-xs font-semibold text-brand-crimson">
              {stage.range}
            </span>
          )}
        </div>
      )}

      {stage.note && <p className="mt-4 text-sm italic text-brand-slate">{stage.note}</p>}

      {/* A stage with only loose points (pre / post session) shows a plain list. */}
      {loose.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-brand-slate">
          {loose.map((p) => (
            <li key={p} className="flex gap-2">
              <span aria-hidden className="mt-[7px] size-1 shrink-0 rounded-full bg-brand-crimson/60" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Named steps become a small vertical timeline within the stage. */}
      {titled.length > 0 && (
        <ol className="relative mt-5 list-none space-y-5 border-l-2 border-brand-crimson/25 pl-6">
          {titled.map((step, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[2rem] top-1.5 size-3 rounded-full bg-brand-crimson ring-4 ring-white" />
              <div className="flex flex-wrap items-baseline gap-x-2">
                <h4 className="font-display text-sm font-bold text-brand-navy">{step.title}</h4>
                {step.range && <span className="text-xs font-semibold text-brand-crimson">{step.range}</span>}
              </div>
              <Points points={step.points} />
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export default function ProgramJourney({ program }) {
  const data = PROGRAM_JOURNEYS[program.slug] || fromBackend(program.journey)
  if (!data) return null

  return (
    <div>
      <div className="text-center">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-brand-navy capitalize">Program journey</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-brand-slate">
          What actually happens, stage by stage — from the moment you book to the follow-up after the
          last session.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {data.stages.map((stage, i) => (
          <Stage key={i} stage={stage} n={i + 1} />
        ))}
      </div>

      {data.closing && (
        <p className="mt-5 rounded-2xl border border-brand-crimson/15 bg-brand-crimson/5 p-5 text-center text-sm font-medium italic text-brand-navy">
          {data.closing}
        </p>
      )}

      {/* What the program includes */}
      <div className="mt-8 rounded-2xl border border-brand-navy/10 bg-brand-cream p-5">
        <h3 className="font-display text-base font-bold text-brand-navy">What the program includes</h3>
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
