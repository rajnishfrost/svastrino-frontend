/**
 * About · "Our Team" — the people behind the work. Names link to LinkedIn where
 * a profile has been supplied; a member without a photo shows their initials
 * instead, so the grid never breaks.
 */
const TEAM = [
  { name: 'Rohit Gala', role: 'Founder & Chief Career Mentor', years: '17+ years', photo: null, linkedin: null },
  { name: 'Miloni Gala', role: 'Administrative Manager', years: '8+ years', photo: null, linkedin: null },
  { name: 'Divya Shah', role: 'Recruitments', years: '8+ years', photo: null, linkedin: null },
  { name: 'Vanshika Parmar', role: 'Content Writer', years: '2+ years', photo: null, linkedin: null },
  { name: 'Pooja Gindra', role: 'Legal Consultant', years: '3+ years', photo: null, linkedin: null },
  { name: 'Ravindra Yadav', role: 'Web Development', years: null, photo: null, linkedin: null },
]

const initials = (n) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

export default function OurTeam() {
  return (
    <section id="our-team" className="section section--alt">
      <div className="container">
        <div className="text-center">
          <h2 className="section-title">Our Team</h2>
        </div>
        <div className="grid grid-3 about-team">
          {TEAM.map((m) => (
            <article key={m.name} className="card about-member">
              <div className="about-member-photo">
                {m.photo
                  ? <img src={m.photo} alt={m.name} loading="lazy" />
                  : <span aria-hidden>{initials(m.name)}</span>}
              </div>
              <h3>
                {m.linkedin
                  ? <a href={m.linkedin} target="_blank" rel="noopener noreferrer">{m.name}</a>
                  : m.name}
              </h3>
              <p className="about-member-role">{m.role}</p>
              {m.years && <p className="about-member-years">{m.years}</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
