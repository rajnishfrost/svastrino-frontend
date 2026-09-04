import { useRef, useState } from 'react'
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
 * `title` is a COPY of Session.title in the database, not the source of it.
 * Re-ingesting the course sheet renames sessions, and these strings do not
 * follow — they were already stale once. When a week is re-titled, check here:
 *   db.sessions.find({ order: { $in: [4, 5, 21, 23] } }, { order: 1, title: 1 })
 *
 * Add or swap a lesson by editing PREVIEWS; an empty list hides the section
 * rather than showing empty frames.
 *
 * Theatre mode is done with grid placement rather than a second layout: the
 * chosen card stays exactly where it is in the list and is simply told to span
 * every column and come first, while the others close ranks below it. That
 * matters because rendering a separate "big player" would be a different node
 * in the tree — React would unmount the running one, and the video a visitor was
 * halfway through would restart from the top of its window.
 */
const CDN = 'https://d16oouzhglk9tq.cloudfront.net/hls'
const mmss = (m, s) => m * 60 + s

const PREVIEWS = [
  {
    week: 5,
    title: 'Confidence is Built, Not Born',
    url: `${CDN}/nirmaan-w05/master.m3u8`,
    start: mmss(4, 57), end: mmss(6, 13), fullSeconds: 458,
  },
  {
    week: 4,
    title: 'Design Your Personal Success Story',
    url: `${CDN}/nirmaan-w04/master.m3u8`,
    start: mmss(7, 5), end: mmss(8, 12), fullSeconds: 651,
  },
  {
    week: 21,
    title: 'Designing Your Career Roadmap',
    url: `${CDN}/nirmaan-w21/master.m3u8`,
    start: mmss(4, 57), end: mmss(6, 2), fullSeconds: 574,
  },
  {
    week: 23,
    title: 'Becoming Successful Anywhere',
    url: `${CDN}/nirmaan-w23/master.m3u8`,
    start: mmss(3, 35), end: mmss(5, 15), fullSeconds: 421,
  },
]

export default function TryConcepts() {
  // Which lesson is playing big, if any. Held here rather than in the player
  // because it is a fact about the SECTION's layout, not about one video.
  const [theatre, setTheatre] = useState(null)
  const cards = useRef([])

  /**
   * Once one lesson is playing big, pressing play on another means "put THAT one
   * up there" — the same thing clicking the next video does under a YouTube
   * player. Only while theatre is already on: in the plain grid, play means
   * play, and rearranging the page under someone who only wanted to watch a card
   * where it sits would be a surprise.
   *
   * The promoted card is scrolled to afterwards, because it has just moved above
   * the place the visitor was looking when they pressed it.
   */
  const promote = (i) => {
    setTheatre((current) => {
      if (current === null || current === i) return current
      requestAnimationFrame(() =>
        cards.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      )
      return i
    })
  }

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
        {/* Three across once one is playing big, so the remaining lessons fill
            their row instead of leaving a hole where the fourth used to be. */}
        <div className={`mt-12 grid gap-6 sm:grid-cols-2 ${theatre === null ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {PREVIEWS.map((v, i) => {
            const big = theatre === i
            return (
              <figure
                key={v.url}
                ref={(el) => { cards.current[i] = el }}
                className={`overflow-hidden rounded-xl border border-nirmaan-sand bg-white shadow-sm ${
                  big ? 'order-first col-span-full border-0 bg-transparent shadow-none' : ''
                }`}
              >
                {/* Capped rather than edge to edge: an aspect-video box across a
                    full container is taller than most screens. */}
                <div className={big ? 'mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-nirmaan-sand bg-white shadow-sm' : ''}>
                  <PreviewPlayer
                    src={v.url} start={v.start} end={v.end} fullSeconds={v.fullSeconds}
                    theatre={big}
                    onTheatre={() => setTheatre(big ? null : i)}
                    onPlayStart={() => promote(i)}
                  />
                  <figcaption className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-nirmaan-green">Week {v.week}</p>
                    <p className="mt-1 text-sm font-semibold text-nirmaan-brown">{v.title}</p>
                  </figcaption>
                </div>
              </figure>
            )
          })}
        </div>
      </div>
    </section>
  )
}
