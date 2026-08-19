/**
 * About · "Media Recognition" — the press cuttings, as a continuously scrolling
 * band. Third-party proof carries further than anything we say ourselves.
 *
 * Add the scans to CUTTINGS to switch this on; the section hides itself while
 * the list is empty rather than showing an empty rail.
 */
const CUTTINGS = [] // { src, title } — scanned newspaper/magazine articles

export default function MediaRecognition() {
  if (!CUTTINGS.length) return null

  // Doubled so the marquee can loop without a visible seam.
  const reel = [...CUTTINGS, ...CUTTINGS]

  return (
    <section id="media" className="section">
      <div className="container text-center">
        <p className="section-eyebrow">Media recognition</p>
        <h2 className="section-title">Reflections of our impact through National Newspapers</h2>
      </div>
      <div className="about-media-rail">
        <ul className="about-media-reel">
          {reel.map((c, i) => (
            <li key={`${c.src}-${i}`}>
              <img src={c.src} alt={c.title} loading="lazy" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
