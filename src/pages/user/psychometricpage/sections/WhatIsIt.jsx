/**
 * Psychometric · section 2 — what a psychometric test actually is, for a
 * visitor who has never taken one. The blood-test analogy does the work.
 */
const UNCOVERS = [
  'Interests', 'Preferences', 'Strengths', 'Weaknesses',
  'Personality', 'Abilities', 'Natural potential',
]

export default function WhatIsIt() {
  return (
    <section className="section">
      <div className="container text-center">
        <h2 className="section-title">What is Psychometric Testing?</h2>
        <p className="section-sub psy-analogy">
          Think of it like a blood test — but for your career choices.
        </p>
        <p className="section-sub">A psychometric test helps you discover your</p>
        <ul className="psy-uncovers">
          {UNCOVERS.map((u) => <li key={u}>{u}</li>)}
        </ul>
        <p className="section-sub psy-uncovers-after">
          It then uses these insights to help you make better stream and career choices
          with more clarity and confidence.
        </p>
      </div>
    </section>
  )
}
