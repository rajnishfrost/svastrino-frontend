/**
 * Home · "Institutions That Trust Us" — a logo wall that scrolls on its own.
 *
 * STATIC PLACEHOLDERS for now. These eight logos live in /public/partners and
 * are stand-ins so the band reads as a real logo wall while the partner list is
 * still being built. To switch to real partners later, fetch
 * GET /user/organisations and map its `logo` + `name` onto the same shape —
 * nothing else in this component needs to change.
 */
const PARTNERS = [
  { name: 'Greenwood High', logo: '/partners/greenwood.svg' },
  { name: "St. Mary's Academy", logo: '/partners/stmarys.svg' },
  { name: 'Nova International', logo: '/partners/nova.svg' },
  { name: 'Cambridge Public', logo: '/partners/cambridge.svg' },
  { name: 'Horizon Academy', logo: '/partners/horizon.svg' },
  { name: 'Sunrise Vidyalaya', logo: '/partners/sunrise.svg' },
  { name: 'Pinnacle Institute', logo: '/partners/pinnacle.svg' },
  { name: 'Everest Global School', logo: '/partners/everest.svg' },
]

export default function IndustryPresence() {
  // Doubled so the marquee loops without a visible seam.
  const reel = [...PARTNERS, ...PARTNERS]

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="container">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-brand-navy sm:text-3xl">
            Institutions That Trust Us
          </h2>
        </div>
      </div>

      {/* Continuous horizontal scroll (pauses on hover). */}
      <div className="group relative mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
        <ul className="flex w-max flex-nowrap items-center animate-marquee group-hover:[animation-play-state:paused]">
          {reel.map((p, i) => (
            <li key={`${p.name}-${i}`} className="mx-7 shrink-0 md:mx-9" aria-hidden={i >= PARTNERS.length}>
              <img
                src={p.logo}
                alt={i < PARTNERS.length ? p.name : ''}
                loading="lazy"
                className="h-10 w-auto object-contain opacity-70 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 md:h-14"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
