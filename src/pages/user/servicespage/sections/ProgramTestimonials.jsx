import { useEffect, useState } from 'react'
import { fetchTestimonials } from '../../../../api/content.js'
import Testimonials from '../../../../common_component/user/Testimonials/Testimonials.jsx'

/**
 * Program page · proof, from people who took THIS program. Stories carry a
 * program slug, so we show that program's own first and only fall back to
 * the featured ones when it has none yet. Rendered through the shared
 * testimonials carousel (same UI as the home page), embedded (bare) in the
 * program page's flow. Hidden when there is nothing to show.
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
        setStories((mine.length ? mine : all.filter((t) => t.featured)).slice(0, 6))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [slug])

  // Nothing to show yet → render nothing, so no empty band appears.
  if (!stories.length) return null

  return (
    <section className="bg-white py-14 md:py-16">
      <div className="container mx-auto max-w-4xl">
        <Testimonials
          items={stories}
          title={`What clients say ${programName}`}
          bare
          compact
        />
      </div>
    </section>
  )
}
