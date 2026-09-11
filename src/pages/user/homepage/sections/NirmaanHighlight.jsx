import { Link } from 'react-router-dom'
import { ArrowRight, Check, GraduationCap } from 'lucide-react'

/**
 * Home · section 9 — highlight for the Nirmaan Skill-Build product. Uses the
 * Nirmaan palette (green / brown / cream), so it is unaffected by the crimson
 * site accent.
 */
const POINTS = [
  "Youth-Focused Life & Career Development Course",
  "24 Videos with Real-Life Concepts & Examples",
  "Weekly Resource PDF with Extra Depth on Each Topic",
  "Daily 10-Minute Tasks to Build Habits, Mindsets & Skills",
  "Learn at Your Own Pace ",
  "Find a ‘New You’ Through the Course",
]

export default function NirmaanHighlight() {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="container">
        <div className="relative overflow-hidden rounded-[2rem] border border-nirmaan-cream-dark bg-nirmaan-cream">
          <div className="relative grid items-center gap-8 p-8 md:grid-cols-[1.6fr_0.9fr] md:p-12">
            {/* Body — on mobile it sits BELOW the art (column-reverse); on md+ it
                takes the left column of the normal row. */}
            <div className="order-2 md:order-1">
              <span className="inline-flex items-center gap-2 rounded-full bg-nirmaan-brown px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
                New · Skill Build
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown sm:text-4xl">
                Nirmaan — <span className="text-nirmaan-green">Soch Se Vikas</span>
              </h2>
              <p className="mt-4 max-w-2xl text-nirmaan-brown-soft">
                ​Nirmaan is a structured journey to build self-awareness, self-control, discipline, communication, confidence, and other essential skills for life and growth. For students from Grade 7 onwards who want to understand themselves better and handle life and its choices with total self-belief & confidence.
              </p>

              <ul className="mt-6 space-y-3">
                {POINTS.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-nirmaan-brown">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-nirmaan-brown">
                      <Check className="size-3 text-white" />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/skill-build/nirmaan"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-nirmaan-green px-8 text-base font-semibold text-white shadow-sm transition-colors hover:bg-nirmaan-green-dark"
                >
                  Explore Nirmaan <ArrowRight className="size-4" />
                </Link>
                <Link
                  to="/skill-build/nirmaan#free-trial"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-nirmaan-green/40 bg-transparent px-8 text-base font-semibold text-nirmaan-green transition-colors hover:bg-nirmaan-green hover:text-white"
                >
                  Start Your Free Trial <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* Art — on mobile it sits ABOVE the body (column-reverse); on md+ it
                takes the right column of the normal row. */}
            <div className="order-1 flex flex-col items-center justify-center md:order-2">
              {/* <div className="flex size-44 items-center justify-center rounded-full bg-white p-6 shadow-inner ring-1 ring-nirmaan-sand md:size-52"> */}
              <div className="flex size-44 items-center justify-center rounded-full p-6 md:size-52">
                <img src="/nirmaan-vertical-t.png" alt="" aria-hidden className="h-full w-full object-contain scale-[2.5]" />
              </div>
              {/* <span className="mt-4 inline-flex items-center gap-2 text-4xl font-semibold uppercase tracking-wide text-nirmaan-brown p-1 leading-none px-4" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                Nirmaan
              </span>
              <span className="mt-2 inline-flex items-center gap-2 text-base font-thin uppercase tracking-wide bg-nirmaan-brown text-white p-1 leading-none px-9" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                Soch Se Vikas
              </span> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
