import { useEffect, useState } from 'react'
import { fetchTestimonials } from '../../../../api/content.js'
import Testimonials from '../../../../common_component/user/Testimonials/Testimonials.jsx'

/**
 * Programme page · proof, from people who took THIS programme. Stories carry a
 * programme slug, so we show that programme's own first and only fall back to
 * the featured ones when it has none yet. Rendered through the shared
 * testimonials carousel (same UI as the home page), embedded (bare) in the
 * programme page's flow. Hidden when there is nothing to show.
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

  return (
    <Testimonials
      items={stories}
      title={`What ${programName} clients say`}
      bare
      compact
    />
  )
}
