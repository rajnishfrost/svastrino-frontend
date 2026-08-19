import { Link } from 'react-router-dom'

/**
 * Home highlight for the Nirmaan Skill-Build product — announces it as our new
 * offering, a short pitch, an enrol CTA, and a scholarship teaser that links to
 * the full scholarship page.
 */
const POINTS = [
  'Youth-Focused Life & Career Development Course',
  '24 videos with real-life concepts & examples',
  'Daily 10 min tasks to build habits, mindsets & skills',
  'Learn at your own pace',
  'Find a ‘New You’ through the course',
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
              Nirmaan is a structured journey to build self-awareness, self-control, discipline,
              communication, confidence, and other essential skills for life and growth. For
              students from Grade 7 onwards who want to understand themselves better and handle
              life and its choices with total self-belief &amp; confidence.
            </p>
            <ul className="home-nirmaan-points">
              {POINTS.map((p) => <li key={p}>{p}</li>)}
            </ul>

            {/* Scholarship teaser — hidden for now (kept for easy re-enable).
            <div className="home-nirmaan-scholarship">
              <strong>🎓 Scholarship available.</strong> One deserving student can win their entire
              Nirmaan package free. <Link to="/nirmaan-scholarship">See how the scholarship works →</Link>
            </div>
            */}

            <div className="home-nirmaan-ctas">
              <Link to="/skill-build/nirmaan" className="btn btn-primary btn-large">Explore Nirmaan →</Link>
              <Link to="/skill-build/nirmaan#free-trial" className="btn btn-secondary btn-large">Start Your Free Trial →</Link>
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
