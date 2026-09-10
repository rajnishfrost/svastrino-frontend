import { useEffect, useState } from 'react'
import { fetchTestimonials } from '../../../../api/content.js'
import Testimonials from '../../../../common_component/user/Testimonials/Testimonials.jsx'

/**
 * Home · section 6 — "What People Say About Us!".
 * Social proof from students and parents, shown in the shared auto-scrolling
 * testimonials carousel. The whole section stays hidden when there is nothing to
 * show (the shared component returns null on an empty list).
 */
export default function Testimonies() {
  const [stories, setStories] = useState([])

  useEffect(() => {
    let cancelled = false
    fetchTestimonials()
      .then((d) => { if (!cancelled) setStories(d.testimonials || []) })
      .catch(() => {}) // proof is a nice-to-have; never break the home page for it
    return () => { cancelled = true }
  }, [])

  return (
    <Testimonials
      items={stories}
      title="What People Say About Us!"
      subtitle="Discover how the right guidance, mentoring, and support have made a real difference for students and parents."
    />
  )
}
