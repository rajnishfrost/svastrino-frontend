// Homepage is a "big" page, so it is split into section components under
// ./sections/. Home.jsx just composes them in order.
import Hero from './sections/Hero.jsx'
import NirmaanHighlight from './sections/NirmaanHighlight.jsx'
import ProgramsPreview from './sections/ProgramsPreview.jsx'
import WhySvastrino from './sections/WhySvastrino.jsx'
import './Home.css'

export default function Home() {
  return (
    <>
      <Hero />
      <ProgramsPreview />
      <WhySvastrino />
      <NirmaanHighlight />
    </>
  )
}
