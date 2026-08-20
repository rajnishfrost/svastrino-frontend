/**
 * Programme page · the journey, stage by stage, plus what the programme
 * includes in total. The inclusions sit at the foot of the journey so the
 * commitment is clear at exactly the point the visitor has understood it.
 */
export default function ProgramJourney({ program }) {
  const stages = program.journey || []
  if (!stages.length) return null

  return (
    <div className="card svc-panel">
      <h2 className="svc-h2">Program journey</h2>
      <p className="svc-journey-intro">
        What actually happens, stage by stage — from the moment you book to the
        follow-up after the last session.
      </p>

      <ol className="svc-journey">
        {stages.map((s, i) => (
          <li key={i}>
            {s.label && <span className="svc-stage">{s.label}</span>}
            <strong>{s.title}</strong>
            {s.description && <p>{s.description}</p>}
          </li>
        ))}
      </ol>

      <div className="svc-inclusions">
        <h3>What the programme includes</h3>
        <ul>
          {program.duration && <li><strong>Total duration</strong><span>{program.duration}</span></li>}
          {program.sessions && <li><strong>Sessions</strong><span>{program.sessions}</span></li>}
          {program.mode && <li><strong>Delivered</strong><span>{program.mode}</span></li>}
        </ul>
      </div>
    </div>
  )
}
