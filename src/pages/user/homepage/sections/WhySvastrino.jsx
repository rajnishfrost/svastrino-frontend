const POINTS = [
  { icon: '◈', title: 'Personalised', desc: 'Plans aligned to your personality, not a template.' },
  { icon: '◇', title: 'Experienced mentors', desc: 'Guidance from people who have walked the path.' },
  { icon: '◉', title: 'One account', desc: 'Mentoring and courses under a single Svastrino login.' },
]

export default function WhySvastrino() {
  return (
    <section className="section home-band home-band--navy">
      <div className="container">
        <div className="text-center">
          <p className="section-eyebrow">Why Svastrino</p>
          <h2 className="section-title">Guidance that grows with you</h2>
        </div>
        <div className="grid grid-3">
          {POINTS.map((p) => (
            <div key={p.title} className="home-why-card">
              <span className="home-why-icon" aria-hidden>{p.icon}</span>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
