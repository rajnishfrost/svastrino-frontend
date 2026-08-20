import { useEffect, useState } from 'react'
import { Quote, Star } from 'lucide-react'
import { fetchTestimonials } from '../../../../api/content.js'
import SectionHeading from './SectionHeading.jsx'

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
    <section className="bg-soft py-20 md:py-24">
      <div className="container">
        <SectionHeading
          title="What People Say About Us!"
          subtitle="Discover how the right guidance, mentoring, and support have made a real difference for students and parents."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {stories.map((s) => (
            <figure
              key={s.id}
              className="flex flex-col rounded-xl border border-brand-navy/5 bg-white p-6 shadow-sm"
            >
              <Quote className="size-8 fill-brand-crimson/15 text-brand-crimson" />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-brand-navy/80">
                &ldquo;{s.quote}&rdquo;
              </blockquote>
              <div className="mt-5 flex items-center gap-1 text-brand-crimson">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </div>
              <figcaption className="mt-3 flex items-center gap-3 border-t border-brand-navy/10 pt-3">
                {s.photo && (
                  <img
                    src={s.photo}
                    alt=""
                    loading="lazy"
                    className="size-10 rounded-full object-cover"
                  />
                )}
                <div className="leading-tight">
                  <strong className="block text-sm font-bold text-brand-navy">{s.name}</strong>
                  {s.role && <span className="text-xs font-semibold text-brand-slate">{s.role}</span>}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
