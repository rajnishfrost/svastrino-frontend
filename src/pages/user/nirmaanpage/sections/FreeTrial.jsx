import { Link } from 'react-router-dom'
import { ArrowRight, Check, Rocket } from 'lucide-react'
import { useAuth } from '../../../../context/AuthContext.jsx'

/**
 * Nirmaan · the 1-week free trial — the step between watching a preview and
 * paying. A signed-out visitor registers first; a signed-in one starts it.
 */
export default function FreeTrial() {
  const { user } = useAuth()

  return (
    <section id="free-trial" className="bg-nirmaan-cream/50 py-16 md:py-20">
      <div className="container">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-nirmaan-cream-dark bg-white p-8 text-center shadow-sm md:p-12">
          {/* Branded accent ribbon along the top edge. */}
          <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-nirmaan-green via-nirmaan-green-light to-nirmaan-olive" />
          {/* Soft brand glows for depth (kept behind the content). */}
          <span aria-hidden className="pointer-events-none absolute -left-24 top-6 size-56 rounded-full bg-nirmaan-green/10 blur-3xl" />
          <span aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 size-56 rounded-full bg-nirmaan-olive/10 blur-3xl" />

          <div className="relative">
            {/* Nirmaan mark */}
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-nirmaan-cream shadow-inner ring-1 ring-nirmaan-sand">
              <img src="/nirmaan-tree.png" alt="" aria-hidden className="h-full w-full object-contain p-2" />
            </div>

            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-nirmaan-brown px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              <Rocket className="size-3.5" /> Free · 1-week trial
            </span>

            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown sm:text-4xl">
              Liked the Glimpse but Still Unsure?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-nirmaan-brown-soft">
              Start your 1-week free trial and experience the journey for yourself — the real videos,
              the real daily tasks, and the actual feel of the course.
            </p>

            {/* Quick value chips */}
            <ul className="mx-auto mt-6 flex max-w-lg flex-wrap items-center justify-center gap-2.5">
              {['1 full week', 'Real videos & tasks', 'No payment now'].map((t) => (
                <li
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full border border-nirmaan-sand bg-nirmaan-cream/60 px-3 py-1.5 text-xs font-medium text-nirmaan-brown"
                >
                  <Check className="size-3.5 text-nirmaan-green" /> {t}
                </li>
              ))}
            </ul>

            <Link
              to={user ? '/checkout?pkg=nirmaan-payu&trial=1' : '/login?mode=signup'}
              className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-nirmaan-green px-8 text-base font-semibold text-white shadow-sm transition-colors hover:bg-nirmaan-green-dark"
            >
              Register for 1 week Free Trial <ArrowRight className="size-4" />
            </Link>
            {!user && (
              <p className="mt-3 text-sm text-nirmaan-brown-soft">
                You’ll create your account first — the trial starts straight after.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
