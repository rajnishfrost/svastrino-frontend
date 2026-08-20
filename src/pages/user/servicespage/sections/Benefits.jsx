/**
 * Programme page · "Why choose this programme" — what the client walks away
 * with, as opposed to what happens during it. Hidden when empty.
 */
export default function Benefits({ items = [], programName }) {
  if (!items.length) return null
  return (
    <div className="card svc-panel">
      <h2 className="svc-h2">Why choose {programName}</h2>
      <ul className="svc-list">{items.map((b, i) => <li key={i}>{b}</li>)}</ul>
    </div>
  )
}
