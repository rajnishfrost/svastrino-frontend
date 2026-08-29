import { Link } from 'react-router-dom'
import { ArrowRight, Check, GraduationCap } from 'lucide-react'

/**
 * Home · section 9 — highlight for the Nirmaan Skill-Build product. Uses the
 * Nirmaan palette (green / brown / cream), so it is unaffected by the crimson
 * site accent.
 *
 * NOTE: the approved design also shows a scholarship note (a dashed-green box).
 * It stays hidden until the scholarship page is re-enabled in the router and
 * the scholarship copy is confirmed — see the commented block below.
 */
const POINTS = [
  'Youth-Focused Life & Career Development Course',
  '24 videos with real-life concepts & examples',
  'Daily 10 min tasks to build habits, mindsets & skills',
  'Learn at your own pace',
  "Find a 'New You' through the course",
]

export default function NirmaanHighlight() {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="container">
        <div className="relative overflow-hidden rounded-[2rem] border border-nirmaan-cream-dark bg-nirmaan-cream">
          <div className="relative grid items-center gap-8 p-8 md:grid-cols-[1.6fr_0.9fr] md:p-12">
            {/* Body */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-nirmaan-brown px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
                New · Skill Build
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown sm:text-4xl">
                Nirmaan — <span className="text-nirmaan-green">Soch Se Vikas</span>
              </h2>
              <p className="mt-4 max-w-xl text-nirmaan-brown-soft">
                Nirmaan is a structured journey to build self-awareness, self-control, discipline,
                communication, confidence, and other essential skills for life and growth. For
                students from Grade 7 onwards who want to understand themselves better and handle
                life and its choices with total self-belief &amp; confidence.
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

              {/* Scholarship note — hidden until the scholarship route + copy are confirmed.
              <div className="mt-6 rounded-xl border border-dashed border-nirmaan-green/50 bg-white/70 p-4 text-sm text-nirmaan-brown-soft">
                <strong className="font-semibold text-nirmaan-brown">🎓 Scholarship available.</strong>{' '}
                One deserving student can win their entire Nirmaan package free.{' '}
                <Link to="/nirmaan-scholarship" className="font-semibold text-nirmaan-green underline-offset-4 hover:underline">
                  See how the scholarship works →
                </Link>
              </div>
              */}

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

            {/* Art */}
            <div className="flex flex-col items-center justify-center">
              <div className="flex size-44 items-center justify-center rounded-full bg-white p-6 shadow-inner ring-1 ring-nirmaan-sand md:size-52">
                <img src="/nirmaan-tree.png" alt="" aria-hidden className="h-full w-full object-contain" />
              </div>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-nirmaan-brown">
                <GraduationCap className="size-4" /> Soch Se Vikas
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
