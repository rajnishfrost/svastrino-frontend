import { useEffect, useState } from 'react'
import { fetchTestimonials } from '../../../../api/content.js'

/**
 * Home · section 6 — "What People Say About Us!".
 * Social proof from students and parents. The whole section stays hidden when
 * there is nothing to show, so the page never has an empty band.
 */
export default function Testimonies() {
  const [stories, setStories] = useState([])

  useEffect(() => {
    let cancelled = false
    fetchTestimonials(true)
      .then((d) => { if (!cancelled) setStories(d.testimonials || []) })
      .catch(() => {}) // proof is a nice-to-have; never break the home page for it
    return () => { cancelled = true }
  }, [])

  if (!stories.length) return null

  return (
    <section className="section section--alt">
      <div className="container">
        <div className="text-center">
          <h2 className="section-title">What People Say About Us!</h2>
          <p className="section-sub">
            Discover how the right guidance, mentoring, and support have made a real
            difference for students and parents.
          </p>
        </div>
        <div className="grid grid-3">
          {stories.map((s) => (
            <figure key={s.id} className="card home-quote">
              <blockquote>“{s.quote}”</blockquote>
              <figcaption>
                {s.photo && <img src={s.photo} alt="" loading="lazy" />}
                <div>
                  <strong>{s.name}</strong>
                  {s.role && <span>{s.role}</span>}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
