import PreviewPlayer from './PreviewPlayer.jsx'

/**
 * Nirmaan · "Try our concepts" — four real lessons from the course, watchable
 * without registering. The lowest-commitment way to judge the teaching.
 *
 * These are the SAME CloudFront/HLS streams enrolled students watch (Session
 * .videoUrl in the database), not re-cut teaser files — so nothing has to be
 * re-uploaded when a lesson is re-recorded. What makes them previews is the
 * window: `start`/`end` are the only seconds that play, while the seek bar
 * still shows the whole lesson, so a visitor can see exactly how much they are
 * being kept out of. PreviewPlayer enforces it and puts the trial CTA on screen
 * the moment the window runs out.
 *
 * `fullSeconds` is the real length of each master playlist. It is only used
 * before metadata arrives (the un-played card and the first frame of the bar);
 * the element's own duration takes over as soon as it loads.
 *
 * Add or swap a lesson by editing PREVIEWS; an empty list hides the section
 * rather than showing empty frames.
 */
const CDN = 'https://d16oouzhglk9tq.cloudfront.net/hls'
const mmss = (m, s) => m * 60 + s

const PREVIEWS = [
  {
    week: 5,
    title: 'Practising to Build Confidence',
    url: `${CDN}/nirmaan-w05/master.m3u8`,
    start: mmss(4, 57), end: mmss(6, 13), fullSeconds: 458,
  },
  {
    week: 4,
    title: 'Success Visualisation',
    url: `${CDN}/nirmaan-w04/master.m3u8`,
    start: mmss(7, 5), end: mmss(8, 12), fullSeconds: 651,
  },
  {
    week: 21,
    title: 'Design Your Career Roadmap',
    url: `${CDN}/nirmaan-w21/master.m3u8`,
    start: mmss(4, 57), end: mmss(6, 2), fullSeconds: 574,
  },
  {
    week: 23,
    title: 'Become the Eagle',
    url: `${CDN}/nirmaan-w23/master.m3u8`,
    start: mmss(3, 35), end: mmss(5, 15), fullSeconds: 421,
  },
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
            Four lessons from the course, free to watch — no registration needed.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PREVIEWS.map((v) => (
            <figure key={v.url} className="overflow-hidden rounded-xl border border-nirmaan-sand bg-white shadow-sm">
              <PreviewPlayer src={v.url} start={v.start} end={v.end} fullSeconds={v.fullSeconds} />
              <figcaption className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-nirmaan-green">Week {v.week}</p>
                <p className="mt-1 text-sm font-semibold text-nirmaan-brown">{v.title}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
