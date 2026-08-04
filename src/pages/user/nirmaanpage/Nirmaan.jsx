import { useEffect } from 'react'
import Hero from './sections/Hero.jsx'
import Benefits from './sections/Benefits.jsx'
import HowItWorks from './sections/HowItWorks.jsx'
import Packages from './sections/Packages.jsx'
import Scholarship from './sections/Scholarship.jsx'
import './Nirmaan.css'

/**
 * Nirmaan — Skill Build detail page.
 * Sections: Hero · Benefits · How-it-works · Packages · Scholarship. On mount it
 * adds `.theme-nirmaan` to <body> so the whole chrome flips to the Nirmaan
 * green/brown palette; removed on unmount to restore the Svastrino theme.
 */
export default function Nirmaan() {
  useEffect(() => {
    document.body.classList.add('theme-nirmaan')
    return () => document.body.classList.remove('theme-nirmaan')
  }, [])

  return (
    <div className="nirmaan-page">
      <Hero />
      <Benefits />
      <HowItWorks />
      <Packages />
      <Scholarship />
    </div>
  )
}
