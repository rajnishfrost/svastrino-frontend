import { useEffect, useState } from 'react'
import { Quote } from 'lucide-react'
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
    <div>
      <h2 className="text-center font-display text-2xl font-extrabold tracking-tight text-brand-navy">
        What {programName} clients say
      </h2>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {stories.map((t) => (
          <figure key={t.id} className="flex flex-col rounded-xl border border-brand-navy/5 bg-white p-6 shadow-sm">
            <Quote className="size-8 fill-brand-crimson/15 text-brand-crimson" />
            <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-brand-navy/80">“{t.quote}”</blockquote>
            <figcaption className="mt-4 flex items-center gap-3 border-t border-brand-navy/10 pt-4">
              {t.photo && <img src={t.photo} alt="" loading="lazy" className="size-11 rounded-full object-cover" />}
              <div className="leading-tight">
                <strong className="block text-sm font-bold text-brand-navy">{t.name}</strong>
                {t.role && <span className="text-xs font-semibold text-brand-slate">{t.role}</span>}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
