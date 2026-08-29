/**
 * Nirmaan · "Try our concepts" — three real lessons from the course, watchable
 * without registering. The lowest-commitment way to judge the teaching.
 *
 * Add the three clips to PREVIEWS to switch this section on; until then it
 * stays out of the page rather than showing empty frames.
 *
 * PLACEHOLDER clips for now — public sample MP4s so the section is visible and
 * playable. Swap the `url`s for the real Nirmaan preview lessons when they land.
 */
const PREVIEWS = [
  { title: 'Welcome & Your Career Report', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
  { title: 'Discovering Your Interests (RIASEC)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  { title: 'Strengths & Skills Audit', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
]

export default function TryConcepts() {
  if (!PREVIEWS.length) return null

  return (
    <section id="preview" className="bg-white py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-nirmaan-green">Still not sure?</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown sm:text-4xl">
            Get a Glimpse of the Course Videos
          </h2>
          <p className="mt-4 text-lg text-nirmaan-brown-soft">
            Three lessons from the course, free to watch — no registration needed.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PREVIEWS.map((v) => (
            <figure key={v.url} className="overflow-hidden rounded-xl border border-nirmaan-sand bg-white shadow-sm">
              <video src={v.url} controls preload="metadata" playsInline className="aspect-video w-full" />
              <figcaption className="p-4 text-sm font-semibold text-nirmaan-brown">{v.title}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
