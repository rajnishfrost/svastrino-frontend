import { Link } from 'react-router-dom'

/**
 * Nirmaan · a dark strip pointing at the other Skill-Build product, for a
 * visitor who wants to know WHICH career to build towards before they start
 * building themselves.
 */
export default function PsychometricStrip() {
  return (
    <section className="nirmaan-psy-strip">
      <div className="container nirmaan-psy-strip-inner">
        <p>Want to explore career options before starting Nirmaan?</p>
        <Link to="/skill-build/psychometric-testing" className="btn btn-accent">
          Start Psychometric Testing
        </Link>
      </div>
    </section>
  )
}
