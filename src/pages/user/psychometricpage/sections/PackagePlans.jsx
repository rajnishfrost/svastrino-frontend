import { Link } from 'react-router-dom'

/**
 * Psychometric · section 7 — the bundle nudge. Taking the test alongside
 * Nirmaan is cheaper than buying the two separately. The class rule travels
 * with the offer, so nobody follows this link to a plan they cannot buy.
 */
export default function PackagePlans() {
  return (
    <section className="section section--alt">
      <div className="container text-center">
        <h2 className="section-title">Package Plans</h2>
        <p className="section-sub psy-bundle">
          Club it with Nirmaan &amp; get a flat <strong>25% discount</strong> — our
          investment in your development.
        </p>
        <Link to="/skill-build/nirmaan#packages" className="btn btn-primary btn-large">
          See Nirmaan plans →
        </Link>
        <p className="psy-bundle-who">
          The Nirmaan plans that include this test are for students in classes 7 to 12.
        </p>
      </div>
    </section>
  )
}
