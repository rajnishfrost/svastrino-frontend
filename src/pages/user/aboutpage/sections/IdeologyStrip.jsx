import { Link } from 'react-router-dom'

/**
 * About · a strip pointing at the ideology — the pillars the mentoring is
 * built on, for a visitor who wants the "why" behind the method.
 */
export default function IdeologyStrip() {
  return (
    <section className="about-ideology-strip">
      <div className="container about-ideology-inner">
        <p>Our effective mentoring is rooted in our detailed, personal and strong ideology.</p>
        <Link to="/our-ideology" className="btn btn-secondary">Know our Ideology →</Link>
      </div>
    </section>
  )
}
