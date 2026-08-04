export default function Hero() {
  return (
    <section className="nirmaan-hero">
      <div className="container nirmaan-hero-inner">
        <div className="nirmaan-hero-text">
          <span className="nirmaan-eyebrow">Soch Se Vikas Tak</span>
          <h1>
            From “I don’t know what to do” to a <span className="accent">clear career roadmap</span>
          </h1>
          <p className="nirmaan-hero-sub">
            Nirmaan is a one-stop career development ecosystem for classes 9–12 — career awareness,
            a personalised roadmap, and actionable steps to get there.
          </p>
          <div className="nirmaan-hero-ctas">
            <a href="#packages" className="btn btn-primary btn-large">View Packages</a>
            <a href="#how" className="btn btn-secondary btn-large">How it works</a>
          </div>
        </div>

        <div className="nirmaan-hero-img">
          <img src="/nirmaan-logo.png" alt="Nirmaan — Soch Se Vikas Tak" />
        </div>
      </div>
    </section>
  )
}
