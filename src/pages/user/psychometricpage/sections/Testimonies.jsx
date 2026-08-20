/**
 * Psychometric · section 8 — what students felt after taking the test.
 * No quotes have been supplied yet, so the section stays out of the page
 * rather than shipping an empty band. Drop them into STORIES to turn it on.
 */
const STORIES = []

export default function Testimonies() {
  if (!STORIES.length) return null

  return (
    <section className="section">
      <div className="container">
        <div className="text-center">
          <h2 className="section-title">See What Students Feel After They Took the Test</h2>
        </div>
        <div className="grid grid-3">
          {STORIES.map((s) => (
            <figure key={s.name} className="card psy-quote">
              <blockquote>“{s.quote}”</blockquote>
              <figcaption><strong>{s.name}</strong>{s.role && <span>{s.role}</span>}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
