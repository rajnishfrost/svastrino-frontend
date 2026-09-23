import { Link } from 'react-router-dom'
import { useNirmaanStanding } from '../../../../hooks/useNirmaanStanding.js'
import { LEARN_PATH } from '../trialIntent.js'

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
    <section className="relative overflow-hidden bg-gradient-to-br from-nirmaan-cream to-white">
      {/* <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-nirmaan-green/15 blur-3xl" /> */}
      <div className="container relative grid items-center gap-10 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
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
          <img
            src="/NirmaanLogo.png"
            alt="Nirmaan — Soch Se Vikas"
            className="w-64 drop-shadow-xl md:w-96"
          />
        </div>
      </div>
    </section>
  )
}
