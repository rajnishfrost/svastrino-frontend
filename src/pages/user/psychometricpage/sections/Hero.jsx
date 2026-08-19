import { Link } from 'react-router-dom'

/**
 * Psychometric · section 1 — the opening banner.
 * The visitor picks their test straight away; which one depends on their class.
 */
export default function Hero() {
  return (
    <section className="psy-hero">
      <div className="container psy-hero-inner">
        <span className="nirmaan-eyebrow">Psychometric Testing</span>
        <h1>Not sure which stream or career actually fits you?</h1>
        <p className="psy-hero-sub">
          Take this simple test to uncover your natural potential in just 4 easy steps.
        </p>

        <div className="psy-hero-ctas">
          <Link to="#which-test" className="btn btn-primary btn-large">
            Stream Selector<span>Class 7th – 9th</span>
          </Link>
          <Link to="#which-test" className="btn btn-secondary btn-large">
            Career Selector<span>Class 10th – 12th</span>
          </Link>
        </div>

        <p className="psy-hero-after">
          It’s simple — find the best suitable streams or career options that match your
          interests &amp; aspirations.
        </p>
      </div>
    </section>
  )
}
