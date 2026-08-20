/**
 * Programme page · the facts panel — a short description and the three things
 * every visitor asks first: how long, how many sessions, and how it is run.
 */
export default function ProgramOverview({ program }) {
  return (
    <div className="card svc-panel">
      <p className="svc-summary-lg">{program.summary}</p>
      <ul className="svc-facts svc-facts-row">
        {program.duration && <li><strong>Duration:</strong> {program.duration}</li>}
        {program.sessions && <li><strong>Sessions:</strong> {program.sessions}</li>}
        {program.mode && <li><strong>Mode:</strong> {program.mode}</li>}
      </ul>
    </div>
  )
}
