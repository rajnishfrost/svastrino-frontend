import { PRE_TEST_GUIDES } from './preTestGuides.js'

/**
 * The pre-test guide for the student's own test — Stream Selector or Career
 * Selector, picked by their class on the server (`testType`). Laid out to be
 * read in a pop-up: the test at a glance, then the time-bound section, how to
 * split it into two sittings, the do's and don'ts, and a last word.
 *
 * With no `testType` (no class on the profile yet), both tests are named so the
 * student can read the one they will sit.
 */
export default function PreTestGuide({ testType }) {
  const g = PRE_TEST_GUIDES[testType]
  if (!g) {
    return (
      <div className="ptg">
        <p className="ptg-lead">
          Your test is picked from your class: <strong>Stream Selector</strong> for classes 7 to 9,
          <strong> Career Selector</strong> for classes 10 to 12. Add your class in Settings to see its guide here.
        </p>
      </div>
    )
  }
  return (
    <div className="ptg">
      <header className="ptg-hero">
        <p className="ptg-eyebrow">Pre-test guide</p>
        <h4 className="ptg-name">{g.name}</h4>
        <div className="ptg-meta">
          <span className="ptg-pill">{g.classes}</span>
          <span className="ptg-pill ptg-pill--time">
            <svg viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            About {g.duration}
          </span>
        </div>
        <p className="ptg-lead">{g.about}</p>
        <ul className="ptg-dims" aria-label="What the test covers">
          {g.dimensions.map((d, i) => <li key={d}><span>{i + 1}</span>{d}</li>)}
        </ul>
      </header>

      <section className="ptg-sec">
        <h5><span className="ptg-ico" aria-hidden>⏱</span>The Aptitude section is time-bound</h5>
        <ul className="ptg-list">
          {g.aptitude.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </section>

      <section className="ptg-sec">
        <h5><span className="ptg-ico" aria-hidden>☕</span>Taking it in two sittings</h5>
        <p className="ptg-note">If the assessment allows it, you may split it like this:</p>
        <ol className="ptg-steps">
          {g.sittings.map((s, i) => (
            <li key={s.title}>
              <span className="ptg-step-no">{i + 1}</span>
              <div><strong>{s.title}</strong><p>{s.text}</p></div>
            </li>
          ))}
        </ol>
        <p className="ptg-note">Comfortable staying focused for the whole test? You may finish it in one sitting.</p>
      </section>

      <section className="ptg-sec">
        <h5>Before you begin</h5>
        <p className="ptg-note">
          Your responses help us understand your interests, preferences, strengths and aptitude — so please
          read these carefully.
        </p>
        <div className="ptg-cols">
          <div className="ptg-col ptg-col--do">
            <h6><span aria-hidden>✓</span> Do’s</h6>
            <ul>
              {g.dos.map((d) => <li key={d.title}><strong>{d.title}</strong>{d.text}</li>)}
            </ul>
          </div>
          <div className="ptg-col ptg-col--dont">
            <h6><span aria-hidden>✕</span> Don’ts</h6>
            <ul>
              {g.donts.map((d) => <li key={d.title}><strong>{d.title}</strong>{d.text}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <aside className="ptg-close">
        <p className="ptg-close-label">A personal reminder</p>
        <p>
          The assessment is here to understand <em>your</em> unique profile, so there is no need to compare your
          answers or results with friends, peers or classmates. Be honest, focused and consistent — your genuine
          answers make your profile meaningful and personal.
        </p>
        <p className="ptg-close-big">Take your time, stay focused, and most importantly — be yourself.</p>
        <p className="ptg-close-sign">Best wishes!</p>
      </aside>
    </div>
  )
}
