import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="home-hero">
      <div className="container home-hero-inner">
        <div className="home-hero-text">
          <p className="home-hero-eyebrow">Futuristic Career Guidance</p>
          <h1>
            Find your direction with <span>Svastrino</span>
          </h1>
          <p className="home-hero-sub">
            Personalised mentoring and structured courses to help you build a career plan that
            fits who you are — from one exploratory session to a full guided journey.
          </p>
          <div className="home-hero-actions">
            <Link to="/book-online" className="btn btn-primary btn-large">
              Book a Session
            </Link>
            <Link to="/skill-build/nirmaan" className="btn btn-secondary btn-large">
              Explore Nirmaan
            </Link>
          </div>
        </div>
        <div className="home-hero-card">
          <div className="home-hero-stat">
            <strong>4</strong>
            <span>Mentoring programs</span>
          </div>
          <div className="home-hero-stat">
            <strong>9–12</strong>
            <span>Classes covered (Nirmaan)</span>
          </div>
          <div className="home-hero-stat">
            <strong>1</strong>
            <span>Unified account</span>
          </div>
        </div>
      </div>
    </section>
  )
}
