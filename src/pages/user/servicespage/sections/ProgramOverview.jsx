/**
 * Programme page · the facts panel — a short description and the three things
 * every visitor asks first: how long, how many sessions, and how it is run.
 */
export default function ProgramOverview({ program }) {
  return (
    <div className="rounded-2xl border border-brand-navy/5 bg-white p-7 shadow-sm">
      <p className="text-lg leading-relaxed text-brand-slate">{program.summary}</p>
      <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-2 border-t border-brand-navy/10 pt-5 text-sm text-brand-slate">
        {program.duration && <li><strong className="font-semibold text-brand-navy">Duration:</strong> {program.duration}</li>}
        {program.sessions && <li><strong className="font-semibold text-brand-navy">Sessions:</strong> {program.sessions}</li>}
        {program.mode && <li><strong className="font-semibold text-brand-navy">Mode:</strong> {program.mode}</li>}
      </ul>
    </div>
  )
}
