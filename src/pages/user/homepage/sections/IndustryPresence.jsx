/**
 * Home · "Institutions That Trust Us" — a logo wall that scrolls on its own.
 *
 * Real partner logos live in /public/assets/images/partners. To manage these
 * from the backend later, fetch GET /user/organisations and map its `logo` +
 * `name` onto the same shape — nothing else in this component needs to change.
 */
const PARTNERS = [
  { name: 'AIESEC', logo: '/assets/images/partners/AIESEC.png' },
  { name: 'CES', logo: '/assets/images/partners/CES.png' },
  { name: 'Chisel Coaching', logo: '/assets/images/partners/CHISEL-COACHING.jpg' },
  { name: 'DPS', logo: '/assets/images/partners/DPS.jpg' },
  { name: 'Euro School', logo: '/assets/images/partners/Euro-School.jpg' },
  { name: 'Finplan', logo: '/assets/images/partners/Finplan.png' },
  { name: 'Gurukul', logo: '/assets/images/partners/gurukul.png' },
  { name: 'Hiren Gangar', logo: '/assets/images/partners/Hiren-Gangar.jpg' },
  { name: 'Iyer Commerce Classes', logo: '/assets/images/partners/Iyer-Commerce-Classes.jpg' },
  { name: 'KES', logo: '/assets/images/partners/KES.png' },
  { name: 'MT Educare', logo: '/assets/images/partners/MT-Educare.png' },
  { name: 'NES', logo: '/assets/images/partners/NES.png' },
  { name: 'NK College', logo: '/assets/images/partners/NK-College.jpg' },
  { name: 'Perpetual Classes, Vasai', logo: '/assets/images/partners/Perpectual-Classes-Vasai.png' },
  { name: 'R. A. Podar', logo: '/assets/images/partners/R-A-Podar.jpg' },
  { name: 'SGI', logo: '/assets/images/partners/SGI.png' },
  { name: "Shobha's Group Tuitions", logo: '/assets/images/partners/Shobhas-Group-Tuts.jpg' },
  { name: 'Sundaram', logo: '/assets/images/partners/Sundaram.png' },
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
