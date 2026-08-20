/**
 * Home · section 4 — "Your Journey in 5 Simple Steps".
 * A left-to-right strip that shows the whole arc at a glance, so the visitor
 * understands what working with us actually looks like before they commit.
 */
const STEPS = [
  { label: 'Discover', text: 'Know yourself, interests & potential' },
  { label: 'Understand', text: 'Gain career clarity & direction' },
  { label: 'Build', text: 'Develop mindset, skills & profile' },
  { label: 'Experience', text: 'Apply learning through real opportunities' },
  { label: 'Progress', text: 'Make confident decisions and progress towards success' },
]

export default function YourJourney() {
  return (
    <section className="section">
      <div className="container">
        <div className="text-center">
          <h2 className="section-title">Your Journey in 5 Simple Steps</h2>
        </div>
        <ol className="home-journey">
          {STEPS.map((s, i) => (
            <li key={s.label} className="home-journey-step">
              <span className="home-journey-n" aria-hidden>{i + 1}</span>
              <strong className="home-journey-label">{s.label} →</strong>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
