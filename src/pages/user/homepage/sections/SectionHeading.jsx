/**
 * Centred section heading — eyebrow + title + subtitle.
 * Mirrors the approved prototype's SectionHeading look.
 */
export default function SectionHeading({ eyebrow, title, subtitle, invert = false }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-crimson">
          {eyebrow}
        </p>
      )}
      <h2
        className={`mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-[1.1] ${
          invert ? 'text-white' : 'text-brand-navy'
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-lg ${invert ? 'text-white/70' : 'text-brand-slate'}`}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
