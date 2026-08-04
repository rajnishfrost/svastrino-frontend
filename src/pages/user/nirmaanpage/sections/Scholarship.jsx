// Institution scholarship competition (per SRS §4.13). A partner school/college
// runs a scholarship test; the top scorer wins their entire package for free.
const STEPS = [
  { n: 1, title: 'Partner institution', text: 'Your school or college partners with Svastrino to host the scholarship for its students.' },
  { n: 2, title: 'Take the test', text: 'Eligible students sit a timed, auto-scored scholarship test on the platform.' },
  { n: 3, title: 'Top the leaderboard', text: 'Students are ranked by score — ties broken by who finished fastest.' },
  { n: 4, title: 'Win it free', text: 'The top scorer wins: their entire Nirmaan package becomes 100% free.' },
]

export default function Scholarship() {
  return (
    <section id="scholarship" className="section">
      <div className="container text-center">
        <p className="section-eyebrow">Scholarship</p>
        <h2 className="section-title">Win a full scholarship</h2>
        <p className="section-sub">
          We partner with schools and colleges to give one deserving student their entire
          Nirmaan package — completely free. Compete, top the test, and it's yours.
        </p>
        <div className="grid grid-4 nirmaan-steps">
          {STEPS.map((s) => (
            <div key={s.n} className="card nirmaan-step">
              <div className="nirmaan-step-n">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
        <p className="section-sub nirmaan-scholarship-note">
          <a href="/nirmaan-scholarship">See full scholarship details →</a> · Are you a school or college?{' '}
          <a href="/contact">Partner with us</a> to bring the Nirmaan scholarship to your students.
        </p>
      </div>
    </section>
  )
}
