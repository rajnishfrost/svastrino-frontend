/**
 * Psychometric · section 2 — what a psychometric test actually is, for a
 * visitor who has never taken one. The blood-test analogy does the work, and
 * the report block below it says what arrives at the end, because that is what
 * a parent is really paying for.
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

        <div className="psy-report">
          <h3>What you get at the end</h3>
          <ul>
            <li>
              Your answers are read on the RIASEC scale, which sorts what interests you
              into six broad types.
            </li>
            <li>
              A report of up to 40 pages — your strengths, your weaker areas, your
              personality, your interests and your preferences, in plain language.
            </li>
            <li>The top 5 careers that suit you best, named and explained.</li>
          </ul>
          <p className="psy-report-who">The test is for students in classes 7 to 12.</p>
        </div>
      </div>
    </section>
  )
}
