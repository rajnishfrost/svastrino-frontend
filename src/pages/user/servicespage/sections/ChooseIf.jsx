/**
 * Programme page · "Choose this program if…" — lets the visitor rule
 * themselves in or out before reading any further. Hidden when empty.
 */
export default function ChooseIf({ items = [] }) {
  if (!items.length) return null
  return (
    <div className="card svc-panel">
      <h2 className="svc-h2">Choose this program if…</h2>
      <ul className="svc-list">{items.map((c, i) => <li key={i}>{c}</li>)}</ul>
    </div>
  )
}
