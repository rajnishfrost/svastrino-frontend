/**
 * About · "Meet Rohit Gala" — the founder's own story, at length. The strongest
 * trust asset on the site: he went through the problem the company now solves.
 */
const PARAS = [
  'Rohit Gala knows what it feels like to choose a career without guidance. Like many students, he spent years trying different paths before finding the one that fit. He didn’t let that experience go to waste. It became the reason he started Svastrino, with one clear mission — no student should have to struggle the way he did.',
  'Rohit trained properly for this work. He holds a Diploma in Counselling Psychology and a Master’s in Sociology, which made him one of the few licensed career and education counsellors in India. Within four years, he had built a personalised career mentoring program running across the country.',
  'His understanding of careers didn’t come from books alone. He has spent years talking to professors, corporate leaders, entrepreneurs, and consultants, building a real picture of what different fields actually demand.',
  'He hasn’t stopped learning either. He later completed a Diploma in Introduction to Psychology from Yale University, scoring 97.05%.',
  'Rohit still works the same way he did on day one — understand the student first, and let the career plan follow from that. What drives him now is bigger than one student at a time. He wants a generation that chooses its own path, instead of settling for whatever was expected of them.',
]

export default function MeetRohit() {
  return (
    <section id="meet-rohit" className="section section--alt">
      <div className="container about-founder-wrap">
        <div className="about-founder-photo">
          <img
            src="/uploads/content/2023/04/meet-rohit.jpg"
            alt="Rohit M. Gala, founder of Svastrino"
            loading="lazy"
          />
          <div>
            <h3>Rohit M. Gala</h3>
            <p className="about-founder-role">Founder &amp; Chief Career Mentor · 17+ years</p>
          </div>
        </div>
        <div className="about-founder-story">
          <h2 className="section-title" style={{ textAlign: 'left' }}>Meet Rohit Gala</h2>
          {PARAS.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
        </div>
      </div>
    </section>
  )
}
