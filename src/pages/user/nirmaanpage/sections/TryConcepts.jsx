/**
 * Nirmaan · "Try our concepts" — three real lessons from the course, watchable
 * without registering. The lowest-commitment way to judge the teaching.
 *
 * Add the three clips to PREVIEWS to switch this section on; until then it
 * stays out of the page rather than showing empty frames.
 */
const PREVIEWS = [] // { title, url } — course clips chosen for the free preview

export default function TryConcepts() {
  if (!PREVIEWS.length) return null

  return (
    <section id="preview" className="section section--alt">
      <div className="container text-center">
        <p className="section-eyebrow">Still not sure?</p>
        <h2 className="section-title">Get a Glimpse of the Course Videos</h2>
        <p className="section-sub">
          Three lessons from the course, free to watch — no registration needed.
        </p>
        <div className="grid grid-3 nirmaan-previews">
          {PREVIEWS.map((v) => (
            <figure key={v.url} className="card nirmaan-preview">
              <video src={v.url} controls preload="metadata" playsInline />
              <figcaption>{v.title}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
