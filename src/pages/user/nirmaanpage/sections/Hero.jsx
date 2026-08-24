/**
 * Nirmaan · Section 1 — the intro banner. Cream fading to white with a soft
 * green glow; words on the left, the Nirmaan logo on the right. Two buttons
 * jump further down the same page.
 */
export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-nirmaan-cream to-white">
      <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-nirmaan-green/15 blur-3xl" />
      <div className="container relative grid items-center gap-10 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
        <div className="text-center md:text-left">
          <span className="text-sm font-semibold uppercase tracking-wide text-nirmaan-green">
            Soch Se Vikas
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-nirmaan-brown sm:text-5xl">
            Nirmaan — A Mindset &amp; Skill-Building Journey for{' '}
            <span className="italic text-nirmaan-green">India’s Teens and Youth</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-nirmaan-brown-soft">
            Nirmaan is a personally crafted all-in-one resource to help you build yourself first
            and turn your dreams into reality, from Class 7th onwards.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:justify-start">
            <a
              href="#packages"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-nirmaan-green px-7 text-base font-semibold text-white shadow-sm transition-colors hover:bg-nirmaan-green-dark"
            >
              View Packages
            </a>
            <a
              href="#journey"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-nirmaan-green/40 bg-white px-7 text-base font-semibold text-nirmaan-green transition-colors hover:bg-nirmaan-green hover:text-white"
            >
              Explore the Course Below
            </a>
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <img
            src="/nirmaan-logo.png"
            alt="Nirmaan — Soch Se Vikas"
            className="w-64 drop-shadow-xl md:w-80"
          />
        </div>
      </div>
    </section>
  )
}
