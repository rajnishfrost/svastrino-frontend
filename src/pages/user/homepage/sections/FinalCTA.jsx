import { Link } from 'react-router-dom'

/**
 * Full-bleed gradient CTA band — the closing "Ready to..." section from the
 * prototype. Uses the accent gradient so it recolors with the chosen accent.
 */
export default function FinalCTA() {
  return (
    <section className="home-final">
      <div className="container home-final-inner">
        <h2 className="home-final-title">Ready to discover your career path?</h2>
        <p className="home-final-sub">
          Take the first step from “I don’t know” to a clear, personalised career plan.
        </p>
        <Link to="/book-online" className="btn btn-large home-final-btn">
          Book your first session →
        </Link>
        <p className="home-final-note">One account for mentoring &amp; courses.</p>
      </div>
    </section>
  )
}
