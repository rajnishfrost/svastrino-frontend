/**
 * Programme page · the journey, stage by stage, plus what the programme
 * includes in total. The inclusions sit at the foot of the journey so the
 * commitment is clear at exactly the point the visitor has understood it.
 */
export default function ProgramJourney({ program }) {
  const stages = program.journey || []
  if (!stages.length) return null

  return (
    <div className="rounded-2xl border border-brand-navy/5 bg-white p-7 shadow-sm">
      <h2 className="font-display text-xl font-bold text-brand-navy">Program journey</h2>
      <p className="mt-2 text-sm text-brand-slate">
        What actually happens, stage by stage — from the moment you book to the follow-up after the
        last session.
      </p>

      <ol className="mt-6 space-y-6 border-l-2 border-brand-crimson/20 pl-6">
        {stages.map((s, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[1.95rem] top-1 flex size-4 items-center justify-center rounded-full border-2 border-brand-crimson bg-white" />
            {s.label && (
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-crimson">{s.label}</span>
            )}
            <strong className="block font-display text-base font-bold text-brand-navy">{s.title}</strong>
            {s.description && <p className="mt-1 text-sm leading-relaxed text-brand-slate">{s.description}</p>}
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-xl border border-brand-navy/10 bg-brand-cream p-5">
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
