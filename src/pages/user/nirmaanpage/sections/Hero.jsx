import { Link } from 'react-router-dom'
import { useNirmaanStanding } from '../../../../hooks/useNirmaanStanding.js'
import { LEARN_PATH } from '../trialIntent.js'
import Wave from '../../homepage/sections/Wave.jsx'

/**
 * Nirmaan · Section 1 — the intro banner. Cream fading to white with a soft
 * green glow; words on the left, the Nirmaan logo on the right.
 *
 * The button answers to who is looking: someone taking the course (bought or
 * on the free week) is sent back into it, and everyone else to the packages
 * further down this page.
 */
export default function Hero() {
  const standing = useNirmaanStanding()
  const learning = standing === 'owned' || standing === 'trial'
  return (
    // Phones: cream all the way down (the diagonal fade reached white there,
    // so the white wave — and the line between this and the next section —
    // vanished). Wider screens keep the fade.
    <section className="relative overflow-hidden bg-gradient-to-b from-nirmaan-cream to-nirmaan-cream-dark/40 md:bg-gradient-to-br md:from-nirmaan-cream md:to-white">
      {/* <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-nirmaan-green/15 blur-3xl" /> */}
      <div className="container relative grid grid-cols-1 items-center gap-6 pb-24 pt-10 md:gap-10 md:pb-36 md:pt-24 md:grid-cols-[1.2fr_1fr]">
        <div className="text-center md:text-left">
          <span className="text-sm font-semibold uppercase tracking-wide text-nirmaan-green">
            Soch Se Vikas
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-nirmaan-brown sm:text-5xl">
            <span className={`!z-20`}>Nirmaan — A Mindset &amp; Skill-Building Journey for{' '}</span>
            <span className="bg-nirmaan-green text-white p-2 rounded-md !leading-none inline-block mt-1.5">India’s Teens and Youth</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-nirmaan-brown-soft">
            {/* Nirmaan is a personally crafted all-in-one resource to help you build yourself first and turn your dreams into reality, from Class 7th onwards. */}
            Nirmaan is a personally crafted all-in-one resource to help you build yourself first and turn your dreams into reality, from class 7 onwards.
          </p>
          {/* Out of sight, not out of the layout, while the standing loads — so
              a student in the course never sees "View Packages" flash first. */}
          <div className={`mt-8 flex flex-col items-center gap-3 sm:flex-row md:justify-start ${standing === undefined ? 'invisible' : ''}`}>
            {learning ? (
              <>
                <Link
                  to={LEARN_PATH}
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-nirmaan-green px-7 text-base font-semibold text-white shadow-sm transition-colors hover:bg-nirmaan-green-dark"
                >
                  {standing === 'trial' ? 'Continue your free trial' : 'Continue your course'}
                </Link>
                <a
                  href="#packages"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-nirmaan-green/40 bg-white px-7 text-base font-semibold text-nirmaan-green transition-colors hover:bg-nirmaan-green hover:text-white"
                >
                  View Packages
                </a>
              </>
            ) : (
              <a
                href="#packages"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-nirmaan-green px-7 text-base font-semibold text-white shadow-sm transition-colors hover:bg-nirmaan-green-dark"
              >
                View Packages
              </a>
            )}
            {/* <a
              href="#journey"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-nirmaan-green/40 bg-white px-7 text-base font-semibold text-nirmaan-green transition-colors hover:bg-nirmaan-green hover:text-white"
            >
              Explore the Course Below
            </a> */}
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          {/* The PNG is square with the mark in a wide band across its middle;
              on phones it is cropped to that band, or it leaves a tall empty
              gap above and below. */}
          <img
            src="/NirmaanLogo.png"
            alt="Nirmaan — Soch Se Vikas"
            className="aspect-[20/7] w-72 object-cover drop-shadow-xl md:aspect-square md:w-96"
          />
        </div>
      </div>

      {/* Curved divider into the next (white) section — same wave the other pages use. */}
      <Wave color="#ffffff" />
    </section>
  )
}
