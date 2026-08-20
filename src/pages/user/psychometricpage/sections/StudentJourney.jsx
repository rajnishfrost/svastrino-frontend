/**
 * Psychometric · section 4 — the same process told from the student's side:
 * what they actually do, in order.
 */
const STEPS = [
  { title: 'Choose Your Test', text: 'Select the assessment based on your class and career stage.' },
  { title: 'Take the Assessment', text: 'Answer each question honestly; there are no right or wrong answers.' },
  { title: 'Understand Your Profile', text: 'Get clear insights into your interests, strengths, and suitable directions.' },
  { title: 'Explore Your Options', text: 'Use your results to explore streams, subjects, and career paths with confidence.' },
]

export default function StudentJourney() {
  return (
    <section className="section">
      <div className="container">
        <div className="text-center">
          <h2 className="section-title">Student Journey</h2>
        </div>
        <ol className="psy-journey">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="psy-journey-n" aria-hidden>{i + 1}</span>
              <div>
                <strong>{s.title}</strong>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
