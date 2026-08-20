import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'
import './Footer.css'

const COLUMNS = [
  {
    title: 'Services',
    links: [
      { label: "Bull's Eye", to: '/services/bulls-eye' },
      { label: 'Bloom', to: '/services/bloom' },
      { label: 'Breakthrough', to: '/services/breakthrough' },
      { label: 'Nirmaan', to: '/skill-build/nirmaan' },
      { label: 'Book Online', to: '/book-online' },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'Career Library', to: '/resources/career-library' },
      { label: 'Blog', to: '/blog' },
      { label: "FAQ's", to: '/resources/faqs' },
      { label: 'Success Stories', to: '/resources/success-stories' },
    ],
  },
  // NOTE: the third column is built per visitor — see registerColumn() below.
  null,
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Ideology', to: '/our-ideology' },
      { label: 'Contact Us', to: '/contact' },
    ],
  },
]

/**
 * The third column changes with who is looking. Signing up and logging in are
 * useless links once you are signed in — /login bounces a signed-in visitor
 * straight back out — so they are swapped for the places that account can
 * actually go.
 */
function registerColumn(user) {
  return {
    title: user ? 'Your account' : 'Register',
    links: [
      // Scholarship is hidden for now, so partner enquiries go through Contact.
      { label: 'Partner with us', to: '/contact' },
      ...(user
        ? [
            { label: 'Dashboard', to: '/dashboard' },
            { label: 'My Downloads', to: '/downloads' },
            { label: 'Settings', to: '/settings' },
          ]
        : [
            { label: 'Students Registration', to: '/login?mode=signup' },
            { label: 'Students Login', to: '/login' },
          ]),
    ],
  }
}

export default function Footer() {
  const year = new Date().getFullYear()
  const { user } = useAuth()
  const columns = COLUMNS.map((c) => c || registerColumn(user))

  return (
    <footer className="footer">
      <div className="container footer-inner">
        {/* Brand is always Svastrino — same lockup as the Navbar, even on the Nirmaan
            page. Users always know they're inside the Svastrino ecosystem. */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            {/* White wordmark variant so the navy-text logo reads on the dark footer. */}
            {/* <img src="/logo-white.png" alt="Svastrino Consultancy Services" /> */}
            {/* Same trademark as the Navbar, on a white plate so it reads on the
                dark footer (the logo's own background is white by design). */}
            <img src="/logo.png" alt="Svastrino Consultancy Services" />
          </Link>
          <p className="footer-tagline">
            Futuristic career guidance — personalised mentoring &amp; courses to shape your path.
          </p>
          <p className="footer-offices">Thane · Dharamshala, India</p>
        </div>

        <div className="footer-cols">
          {columns.map((col) => (
            <div key={col.title} className="footer-col">
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l.to + l.label}>
                    <Link to={l.to}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <span>© {year} Svastrino. All rights reserved.</span>
          <span className="footer-legal">
            <Link to="/legal/terms-of-use">Terms of Use</Link>
            <Link to="/legal/privacy-policy">Privacy Policy</Link>
            <Link to="/legal/cancellations-and-refunds">Cancellations &amp; Refunds</Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
