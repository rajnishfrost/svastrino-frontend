export default function Hero() {
  return (
    <section className="nirmaan-hero">
      <div className="container nirmaan-hero-inner">
        <div className="nirmaan-hero-text">
          <span className="nirmaan-eyebrow">Soch Se Vikas Tak</span>
          <h1>
            Nirmaan — A Mindset &amp; Skill-Building Journey for{' '}
            <span className="accent">India’s Teens and Youth</span>
          </h1>
          <p className="nirmaan-hero-sub">
            Nirmaan is a personally crafted all-in-one resource to help you build yourself
            first and turn your dreams into reality, from Class 7th onwards.
          </p>
          <div className="nirmaan-hero-ctas">
            <a href="#packages" className="btn btn-primary btn-large">View Packages</a>
            <a href="#journey" className="btn btn-secondary btn-large">Explore the Course Below</a>
          </div>
        </div>

        <div className="nirmaan-hero-img">
          <img src="/nirmaan-logo.png" alt="Nirmaan — Soch Se Vikas Tak" />
        </div>
      </div>
    </section>
  )
}
