import { Link } from 'react-router-dom'
import './Footer.css'

const COLUMNS = [
  {
    title: 'Mentoring',
    links: [
      { label: 'Model Session', to: '/mentoring#model-session' },
      { label: "Bull's Eye", to: '/mentoring#bulls-eye' },
      { label: 'Bloom', to: '/mentoring#bloom' },
      { label: 'Breakthrough', to: '/mentoring#breakthrough' },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'Nirmaan', to: '/skill-build/nirmaan' },
      { label: 'Resources', to: '/resources' },
      { label: 'Blog', to: '/blog' },
      { label: 'Book Online', to: '/book-online' },
    ],
  },
  // Scholarship column hidden for now (user-facing scholarship is disabled).
  // {
  //   title: 'Scholarship',
  //   links: [
  //     { label: 'Nirmaan Scholarship', to: '/nirmaan-scholarship' },
  //     { label: 'Partner organisations', to: '/organisations' },
  //     { label: 'Partner with us', to: '/nirmaan-scholarship#partner' },
  //   ],
  // },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'Success Stories', to: '/resources#success-stories' },
      { label: "FAQ's", to: '/resources#faqs' },
    ],
  },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container footer-inner">
        {/* Brand is always Svastrino — same lockup as the Navbar, even on the Nirmaan
            page. Users always know they're inside the Svastrino ecosystem. */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            {/* Same trademark as the Navbar, on a white plate so it reads on the
                dark footer (the logo's own background is white by design). */}
            <img src="/logo.png" alt="Svastrino Consultancy Services" />
          </Link>
          <p className="footer-tagline">
            Futuristic career guidance — personalised mentoring &amp; courses to shape your path.
          </p>
          <p className="footer-offices">Thane · Mumbai · Dharamshala, India</p>
        </div>

        <div className="footer-cols">
          {COLUMNS.map((col) => (
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
