import { Link } from 'react-router-dom'

/**
 * Home · section 8 — "Get To Know Us And Our Roots".
 * The trust close: who we are, and the two ways to read more about us.
 */
export default function AboutUs() {
  return (
    <section className="section">
      <div className="container about-narrow text-center">
        <h2 className="section-title">Get To Know Us And Our Roots</h2>
        <p>
          With 17+ years of experience, we’ve helped thousands of students discover who they
          are, choose the right path, and build the confidence to lead their future.
        </p>
        <p>
          Through personalized guidance, expert mentoring, and skill-building, we equip
          students with the support and tools they need to make informed decisions and reach
          their potential.
        </p>
        <div className="home-about-ctas">
          <Link to="/about" className="btn btn-primary">Learn More About Svastrino →</Link>
          <Link to="/our-ideology" className="btn btn-secondary">
            Check Our Ideology →
          </Link>
        </div>
      </div>
    </section>
  )
}
