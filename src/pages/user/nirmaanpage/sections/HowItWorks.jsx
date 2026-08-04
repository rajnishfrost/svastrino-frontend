const STEPS = [
  { n: 1, title: 'Take the test', text: 'A Mindler-powered psychometric assessment based on the RIASEC interest model.' },
  { n: 2, title: 'Get your report', text: 'A personalised career report (PDF) with a pre-recorded explanation video.' },
  { n: 3, title: 'Follow the roadmap', text: 'A career roadmap with your top 5 careers and actionable next steps.' },
]

export default function HowItWorks() {
  return (
    <section id="how" className="section">
      <div className="container text-center">
        <p className="section-eyebrow">How it works</p>
        <h2 className="section-title">3 steps to career clarity</h2>
        <p className="section-sub">Test, report, roadmap — guidance at every step.</p>
        <div className="grid grid-3 nirmaan-steps">
          {STEPS.map((s) => (
            <div key={s.n} className="card nirmaan-step">
              <div className="nirmaan-step-n">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
