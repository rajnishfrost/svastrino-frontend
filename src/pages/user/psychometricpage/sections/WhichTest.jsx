import { Link } from 'react-router-dom'

/**
 * Psychometric · section 6 — the choice itself, and the only place the price
 * appears. Anchor target for both hero buttons.
 */
const TESTS = [
  {
    name: 'Stream Selector',
    who: 'Class 7th, 8th, or 9th (any board)',
    points: [
      'You want to understand your interests, strengths, and personality better',
      'You’re trying to choose between Science, Commerce, or Humanities/Arts',
    ],
  },
  {
    name: 'Career Selector',
    who: 'Class 10th, 11th, or 12th (any board or stream)',
    points: [
      'You want to understand your interests, strengths, and personality better',
      'You’re trying to find careers that truly match your interests, personality, and future plans',
    ],
  },
]

export default function WhichTest() {
  return (
    <section id="which-test" className="section">
      <div className="container">
        <div className="text-center">
          <h2 className="section-title">Find Which Test Is Right for You</h2>
        </div>
        <div className="grid grid-2">
          {TESTS.map((t) => (
            <div key={t.name} className="card psy-test">
              <h3>{t.name}</h3>
              <p className="psy-test-who">{t.who}</p>
              <ul>{t.points.map((p) => <li key={p}>{p}</li>)}</ul>
              <p className="psy-test-price">₹900</p>
              <Link to="/contact" className="btn btn-primary">Select {t.name}</Link>
            </div>
          ))}
        </div>
        <p className="psy-test-note">INR 900 for each test</p>
      </div>
    </section>
  )
}
