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
        </div>

        <EnquireForm />
      </div>
    </section>
  )
}
