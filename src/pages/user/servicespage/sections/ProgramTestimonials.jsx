import { useEffect, useState } from 'react'
import { fetchTestimonials } from '../../../../api/content.js'

/**
 * Programme page · proof, from people who took THIS programme. Stories carry a
 * programme slug, so we show that programme's own first and only fall back to
 * the featured ones when it has none yet. Hidden when there is nothing to show.
 */
export default function ProgramTestimonials({ slug, programName }) {
  const [stories, setStories] = useState([])

  useEffect(() => {
    let cancelled = false
    setStories([])
    fetchTestimonials()
      .then((d) => {
        if (cancelled) return
        const all = d.testimonials || []
        const mine = all.filter((t) => t.program === slug)
        setStories((mine.length ? mine : all.filter((t) => t.featured)).slice(0, 3))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [slug])

  if (!stories.length) return null

  return (
    <div className="svc-panel-plain">
      <h2 className="svc-h2 text-center">What {programName} clients say</h2>
      <div className="grid grid-3">
        {stories.map((t) => (
          <figure key={t.id} className="card svc-quote">
            <blockquote>“{t.quote}”</blockquote>
            <figcaption>
              {t.photo && <img src={t.photo} alt="" loading="lazy" />}
              <div>
                <strong>{t.name}</strong>
                {t.role && <span>{t.role}</span>}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
