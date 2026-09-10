import { Link } from 'react-router-dom'
import { ArrowRight, GraduationCap, School, Star, Users } from 'lucide-react'
import EnquireForm from './EnquireForm.jsx'
import Wave from './Wave.jsx'

/**
 * Home · section 1 — "Banner".
 * The promise, the proof figures, and the two ways in: explore the programs,
 * or leave an enquiry without choosing anything yet.
 */
const STATS = [
  { icon: Star, figure: '17 Years', caption: 'of experience' },
  { icon: GraduationCap, figure: '14k+', caption: 'Students counselled' },
  { icon: Users, figure: '290', caption: 'Students mentored' },
  { icon: School, figure: '49', caption: 'Partner institutions' },
]

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero">
      <div className="container relative pb-28 pt-14 md:pb-36 md:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Left — message */}
          <div className="text-center lg:text-left lg:[transform:translateY(-2.5rem)]">
            <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-brand-navy sm:text-5xl md:text-[3.25rem]">
              Build Yourself to <br /><span className="text-brand-crimson">Build Your Career</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-brand-slate sm:text-lg lg:mx-0">
              Helping you make informed career choices while developing your <span className={`underline`}>Mindset</span>, <span className={`underline`}>Skills</span> and
              then <span className={`underline`}>Actions</span> to build your successful future.
            </p>

            {/* Stats — proof figures as chips, kept in a tidy 2×2 grid */}
            <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-3 lg:mx-0">
              {STATS.map((s) => (
                <div
                  key={s.caption}
                  className="flex items-center gap-2.5 rounded-2xl border border-brand-navy/10 bg-white/70 px-4 py-2.5 shadow-sm backdrop-blur-sm"
                >
                  <span className="flex size-9 items-center justify-center rounded-xl bg-brand-rose text-brand-crimson">
                    <s.icon className="size-[18px]" />
                  </span>
                  <span className="leading-tight">
                    <strong className="block font-display text-base font-bold text-brand-navy">
                      {s.figure}
                    </strong>
                    <span className="text-xs text-brand-slate">{s.caption}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                to="/services"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-crimson px-8 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-crimson-dark capitalize"
              >
                Explore Our Programs <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Right — enquiry form (stacks below the message on mobile/tablet) */}
          <div className="rounded-2xl border border-brand-navy/5 bg-white p-6 shadow-xl shadow-brand-navy/5">
            <EnquireForm />
          </div>
        </div>
      </div>

      {/* Curved divider into the next (white) section. */}
      <Wave color="#ffffff" />
    </section>
  )
}
