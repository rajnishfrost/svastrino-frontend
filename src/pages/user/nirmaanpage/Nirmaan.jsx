import { useEffect } from 'react'
import Hero from './sections/Hero.jsx'
import Journey from './sections/Journey.jsx'
import Benefits from './sections/Benefits.jsx'
import TryConcepts from './sections/TryConcepts.jsx'
import FreeTrial from './sections/FreeTrial.jsx'
import Packages from './sections/Packages.jsx'
import PsychometricStrip from './sections/PsychometricStrip.jsx'
import { usePageSeo } from '../../../seo/PageSeo.jsx'

/**
 * Nirmaan — Skill Build detail page, in the order the content sheet lays it out
 * (src/content/skill-build.md): what it is → the 24-week journey → what you get
 * → try it → try it for a week → what it costs → the other Skill-Build product.
 * On mount it adds `.theme-nirmaan` to <body> so the whole chrome flips to the
 * green/brown/cream palette; removed on unmount.
 *
 * NOTE: the Testimonials and FAQ sections are not in the approved content spec,
 * so they are not rendered (the components remain on disk for easy re-add).
 */
export default function Nirmaan() {
  usePageSeo({
    title: 'Nirmaan — a 24-week skill-build course for Indian teens',
    description: 'A structured 24-week course building mindset, self-awareness, confidence and action — weekly videos with daily tasks, for students in classes 7 to 12.',
  })
  useEffect(() => {
    document.body.classList.add('theme-nirmaan')
    return () => document.body.classList.remove('theme-nirmaan')
  }, [])

  return (
    <div>
      <Hero />
      <Journey />
      <Benefits />
      <div className={`w-full bg-nirmaan-brown py-8 -translate-y-10`}>
        <p className="mx-auto mt-10 max-w-3xl text-center font-display text-lg font-semibold italic text-white ">
          From “I don’t know if I can” → “I know myself, I can learn, I can adapt, and I know what I
          can do next.”
        </p>
      </div>
      <TryConcepts />
      <FreeTrial />
      <Packages />
      {/* <PsychometricStrip /> */}
    </div>
  )
}
