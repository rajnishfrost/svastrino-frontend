import { useEffect } from 'react'
import Hero from './sections/Hero.jsx'
import Journey from './sections/Journey.jsx'
import Benefits from './sections/Benefits.jsx'
import TryConcepts from './sections/TryConcepts.jsx'
import FreeTrial from './sections/FreeTrial.jsx'
import Packages from './sections/Packages.jsx'
import PsychometricStrip from './sections/PsychometricStrip.jsx'
import Testimonials from './sections/Testimonials.jsx'
import Faqs from './sections/Faqs.jsx'
// Scholarship section hidden for now — re-add <Scholarship /> below to restore.
// import Scholarship from './sections/Scholarship.jsx'
import './Nirmaan.css'

/**
 * Nirmaan — Skill Build detail page, in the order the sheet lays it out:
 * what it is → the 24-week journey → what you get → try it → try it for a week
 * → what it costs → the other Skill-Build product → proof → questions.
 * On mount it adds `.theme-nirmaan` to <body> so the whole chrome flips to the
 * green/brown/cream palette; removed on unmount.
 */
export default function Nirmaan() {
  useEffect(() => {
    document.body.classList.add('theme-nirmaan')
    return () => document.body.classList.remove('theme-nirmaan')
  }, [])

  return (
    <div className="nirmaan-page">
      <Hero />
      <Journey />
      <Benefits />
      <TryConcepts />
      <FreeTrial />
      <Packages />
      <PsychometricStrip />
      <Testimonials />
      <Faqs />
    </div>
  )
}
