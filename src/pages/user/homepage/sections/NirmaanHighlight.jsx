import { Link } from 'react-router-dom'

/**
 * Home highlight for the Nirmaan Skill-Build product — announces it as our new
 * offering, a short pitch, an enrol CTA, and a scholarship teaser that links to
 * the full scholarship page.
 */
const POINTS = [
  'Psychometric test + personalised career report',
  'A clear, step-by-step career roadmap',
  'Mentoring sessions & worksheets for classes 9–12',
]

export default function NirmaanHighlight() {
  return (
    <section className="section home-nirmaan">
      <div className="container">
        <div className="home-nirmaan-card">
          <div className="home-nirmaan-body">
            <span className="home-nirmaan-badge">New · Skill Build</span>
            <h2 className="home-nirmaan-title">Nirmaan — <span>Soch Se Vikas Tak</span></h2>
            <p className="home-nirmaan-sub">
              Our new career-development program for classes 9–12. From “I don’t know what to do”
              to a clear career roadmap — with a psychometric report, mentoring, and actionable steps.
            </p>
            <ul className="home-nirmaan-points">
              {POINTS.map((p) => <li key={p}>{p}</li>)}
            </ul>

            <div className="home-nirmaan-scholarship">
              <strong>🎓 Scholarship available.</strong> One deserving student can win their entire
              Nirmaan package free. <Link to="/nirmaan-scholarship">See how the scholarship works →</Link>
            </div>

            <div className="home-nirmaan-ctas">
              <Link to="/skill-build/nirmaan#packages" className="btn btn-primary btn-large">Enrol in Nirmaan</Link>
              <Link to="/skill-build/nirmaan" className="btn btn-secondary btn-large">Learn more</Link>
            </div>
          </div>

          <div className="home-nirmaan-art" aria-hidden>
            <div className="home-nirmaan-emblem">
              <img src="/nirmaan-tree.png" alt="" />
            </div>
            <span className="home-nirmaan-art-tag">Soch Se Vikas Tak</span>
          </div>
        </div>
      </div>
    </section>
  )
}
