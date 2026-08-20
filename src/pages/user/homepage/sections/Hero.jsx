import { Link } from 'react-router-dom'
import EnquireForm from './EnquireForm.jsx'

/**
 * Home · section 1 — "Banner".
 * The promise, the proof figures, and the two ways in: explore the programs,
 * or leave an enquiry without choosing anything yet.
 */
const STATS = [
  { figure: '17', caption: 'Years of experience' },
  { figure: '14k+', caption: 'Students counselled' },
  { figure: '290', caption: 'Students mentored' },
  { figure: '49', caption: 'Partner institutions' },
]

/* Small inline icons — no icon dependency in this project. */
const IconClipboard = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="8" y="3" width="8" height="4" rx="1" /><path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
  </svg>
)
const IconDoc = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M9 13h6M9 17h4" />
  </svg>
)
const IconUsers = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="3" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
  </svg>
)

export default function Hero() {
  return (
    <section className="home-hero">
      <div className="container home-hero-inner">
        <div className="home-hero-text">
          <p className="home-hero-eyebrow">Build Yourself to Build Your Career</p>
          <h1>
            Helping you make informed career choices while developing your{' '}
            <span>Mindset, Skills and Actions</span> to build your successful future
          </h1>

          <ul className="home-hero-stats">
            {STATS.map((s) => (
              <li key={s.caption}>
                <strong>{s.figure}</strong>
                <span>{s.caption}</span>
              </li>
            ))}
          </ul>

          <div className="home-hero-actions">
            <Link to="/services" className="btn btn-primary btn-large">
              Explore our Programs →
            </Link>
          </div>

          {/* Feature strip (true product facts). Swap for real social-proof
              numbers — students guided, rating — once those are available. */}
          <ul className="home-hero-trust">
            <li><span className="home-hero-trust-ic"><IconClipboard /></span> Psychometric assessment</li>
            <li><span className="home-hero-trust-ic"><IconDoc /></span> Personalised career report</li>
            <li><span className="home-hero-trust-ic"><IconUsers /></span> 1-on-1 mentoring</li>
          </ul>
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
        <EnquireForm />
      </div>

      {/* Curved divider into the next (white) section. */}
      <div className="home-hero-wave" aria-hidden>
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0 80 L0 34 C 280 78 620 -6 900 20 C 1140 42 1320 62 1440 30 L 1440 80 Z" />
        </svg>
      </div>
    </section>
  )
}
