// Homepage is a "big" page, so it is split into section components under
// ./sections/. Home.jsx just composes them in order.
//
// POC NOTE: the whole page is wrapped in `.home-root[data-accent]`. The small
// fixed toggle (bottom-right) flips the accent tokens between crimson + blue so
// both directions can be compared live. Remove the toggle once a direction is
// chosen — the winning accent then moves into theme.css site-wide.
import { useState } from 'react'
import Hero from './sections/Hero.jsx'
import ProgramsPreview from './sections/ProgramsPreview.jsx'
import WhySvastrino from './sections/WhySvastrino.jsx'
import HowItWorks from './sections/HowItWorks.jsx'
import NirmaanHighlight from './sections/NirmaanHighlight.jsx'
import FinalCTA from './sections/FinalCTA.jsx'
import './Home.css'

export default function Home() {
  const [accent, setAccent] = useState('crimson')

  return (
    <div className="home-root" data-accent={accent}>
      <Hero />
      <ProgramsPreview />
      <WhySvastrino />
      <HowItWorks />
      <NirmaanHighlight />
      <FinalCTA />

      {/* --- Preview-only accent switcher (delete after the decision) --- */}
      <div className="home-accent-toggle" role="group" aria-label="Preview accent color">
        <span className="home-accent-toggle-label">Accent</span>
        <button
          type="button"
          className={accent === 'crimson' ? 'is-active' : ''}
          onClick={() => setAccent('crimson')}
        >
          Crimson
        </button>
        <button
          type="button"
          className={accent === 'blue' ? 'is-active' : ''}
          onClick={() => setAccent('blue')}
        >
          Blue
        </button>
      </div>
    </div>
  )
}
