import { useEffect } from 'react'
import Hero from './sections/Hero.jsx'
import WhatIsIt from './sections/WhatIsIt.jsx'
import HowItWorks from './sections/HowItWorks.jsx'
import StudentJourney from './sections/StudentJourney.jsx'
import WhoItHelps from './sections/WhoItHelps.jsx'
import WhichTest from './sections/WhichTest.jsx'
import PackagePlans from './sections/PackagePlans.jsx'
import Testimonies from './sections/Testimonies.jsx'
import Faqs from './sections/Faqs.jsx'
import './Psychometric.css'

/**
 * Psychometric Testing — the second Skill-Build product, sold alongside
 * Nirmaan. Like the Nirmaan page it wears the green/brown/cream palette while
 * it is open, so the whole chrome shifts with it.
 */
export default function Psychometric() {
  useEffect(() => {
    document.body.classList.add('theme-nirmaan')
    return () => document.body.classList.remove('theme-nirmaan')
  }, [])

  return (
    <div className="psy-page">
      <Hero />
      <WhatIsIt />
      <HowItWorks />
      <StudentJourney />
      <WhoItHelps />
      <WhichTest />
      <PackagePlans />
      <Testimonies />
      <Faqs />
    </div>
  )
}
