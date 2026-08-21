import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'

/**
 * Site footer (content per src/content/footer.md). Styled with Tailwind to
 * match the approved prototype. Routes are kept as implemented in the router.
 */
const COLUMNS = [
  {
    title: 'Services',
    links: [
      { label: "Bull's Eye", to: '/services/bulls-eye' },
      { label: 'Bloom', to: '/services/bloom' },
      { label: 'Breakthrough', to: '/services/breakthrough' },
      { label: 'Nirmaan', to: '/skill-build/nirmaan' },
      { label: 'Compare programs', to: '/services/compare' },
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
            // Signed-in only: support threads belong to an account, so there is
            // nothing for a signed-out visitor to see there. They have Contact
            // Us in the Company column instead.
            { label: 'Help & support', to: '/support' },
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
    <footer className="mt-auto bg-brand-navy-dark text-white/70">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex rounded-2xl bg-white p-3">
              <img src="/logo.png" alt="Svastrino Consultancy Services" className="h-10 w-auto" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              Futuristic career guidance — personalised mentoring &amp; courses to shape your path.
            </p>
            <p className="mt-3 text-sm text-white/55">Thane · Dharamshala, India</p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-white">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.to + l.label}>
                    <Link to={l.to} className="transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs sm:flex-row">
          <span>© {year} Svastrino. All rights reserved.</span>
          <span className="flex gap-5">
            <Link to="/legal/terms-of-use" className="hover:text-white">
              Terms of Use
            </Link>
            <Link to="/legal/privacy-policy" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/legal/cancellations-and-refunds" className="hover:text-white">
              Cancellations &amp; Refunds
            </Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
