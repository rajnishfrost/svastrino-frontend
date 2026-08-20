/**
 * Psychometric · section 3 — the mechanics behind the test, so the result
 * feels earned rather than arbitrary.
 */
const STEPS = [
  { title: 'Take the test', text: 'Answer simple questions about your abilities, aptitude, personality, and behaviours.' },
  { title: 'Verification', text: 'Your responses get analysed across different parameters & styles. There’s no right or wrong here, so just be yourself.' },
  { title: 'Integrating', text: 'The algorithm identifies industries, jobs, and careers that match you & your needs.' },
  { title: 'Scientific report', text: 'You’ll receive a clear report with insights and career recommendations, tailored just for you.' },
]

export default function HowItWorks() {
  return (
    <section className="section section--alt">
      <div className="container text-center">
        <h2 className="section-title">How It Works</h2>
        <div className="grid grid-4 nirmaan-steps">
          {STEPS.map((s, i) => (
            <div key={s.title} className="card nirmaan-step">
              <div className="nirmaan-step-n">{i + 1}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
