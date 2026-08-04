/**
 * Horizontal numbered timeline — the "How It Works" pattern from the prototype.
 * Built as a reusable step strip: numbers on a connecting line, label + copy
 * under each. Collapses to a vertical list on mobile.
 */
const STEPS = [
  { title: 'Book a session', desc: 'Start with a 15-min Model Session or pick a program that fits your stage.' },
  { title: 'Discover yourself', desc: 'Psychometric assessment maps your interests, aptitude and personality.' },
  { title: 'Get your roadmap', desc: 'A personalised report with career matches and a step-by-step plan.' },
  { title: 'Grow with mentoring', desc: 'Ongoing guidance, worksheets and courses to act on the plan.' },
]

export default function HowItWorks() {
  return (
    <section className="section">
      <div className="container">
        <div className="text-center">
          <p className="section-eyebrow">How it works</p>
          <h2 className="section-title">Your journey in 4 simple steps</h2>
        </div>

        <ol className="home-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="home-step">
              <span className="home-step-num">{i + 1}</span>
              <h3 className="home-step-title">{s.title}</h3>
              <p className="home-step-desc">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
