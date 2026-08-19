// Homepage is a "big" page, so it is split into section components under
// ./sections/. Home.jsx just composes them in the order the visitor meets them:
// trust → the problem → what fits you → how it works → other ways in →
// proof → partners → who we are → the Skill-Build product.
import Hero from './sections/Hero.jsx'
import ProblemsWeSolve from './sections/ProblemsWeSolve.jsx'
import OurServices from './sections/OurServices.jsx'
import YourJourney from './sections/YourJourney.jsx'
import OtherResources from './sections/OtherResources.jsx'
import Testimonies from './sections/Testimonies.jsx'
import IndustryPresence from './sections/IndustryPresence.jsx'
import AboutUs from './sections/AboutUs.jsx'
import NirmaanHighlight from './sections/NirmaanHighlight.jsx'
import './Home.css'

export default function Home() {
  return (
    <>
      <Hero />
      <ProblemsWeSolve />
      <OurServices />
      <YourJourney />
      <OtherResources />
      <Testimonies />
      <IndustryPresence />
      <AboutUs />
      <NirmaanHighlight />
    </>
  )
}
