// Homepage is a "big" page, so it is split into section components under
// ./sections/. Home.jsx just composes them in the order the visitor meets them,
// following the approved content spec (src/content/home-page.md):
//   banner → the problem → what fits you → your journey → other ways in →
//   proof → partners → who we are → the Skill-Build product.
import Hero from './sections/Hero.jsx'
import ProblemsWeSolve from './sections/ProblemsWeSolve.jsx'
import OurServices from './sections/OurServices.jsx'
import YourJourney from './sections/YourJourney.jsx'
import OtherResources from './sections/OtherResources.jsx'
import Testimonies from './sections/Testimonies.jsx'
import IndustryPresence from './sections/IndustryPresence.jsx'
import AboutUs from './sections/AboutUs.jsx'
import NirmaanHighlight from './sections/NirmaanHighlight.jsx'

export default function Home() {
  return (
    <div>
      <Hero />
      <ProblemsWeSolve />
      <OurServices />
      <YourJourney />
      <OtherResources />
      <Testimonies />
      <IndustryPresence />
      <AboutUs />
      <NirmaanHighlight />
    </div>
  )
}
