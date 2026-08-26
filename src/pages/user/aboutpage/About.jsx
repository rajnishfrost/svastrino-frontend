import { Link } from 'react-router-dom'
import { ArrowRight, Compass } from 'lucide-react'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'

// Static About copy (content per src/content/about-svastrino.md). It changes
// rarely, so it lives here rather than in the DB. Programs, FAQs and success
// stories remain dynamic (from /api/user/content).

const FOUNDER_IMG = '/assets/images/founder-rohit-gala.jpg'

const MILESTONES = [
  { year: '2009', title: 'Where It All Began', text: 'Founded by Rohit M. Gala, Svastrino began with 20 students in Mumbai.' },
  { year: '2014', title: 'Built Long-Term Mentoring', text: "Realised that just career counselling isn't enough, and so crafted the Breakthrough Program." },
  { year: '2016', title: 'Our Strongest Media Recognition', text: 'Got featured in The Economic Times 3 times; online services began.' },
  { year: '2017', title: 'Expanded to the Middle East and Africa', text: 'Provided counselling & mentoring across the Asian & African continents.' },
  { year: '2021', title: 'Global Reach', text: 'Provided services to 10,000+ clients in over 22 countries & 4 continents.' },
  { year: '2026', title: 'Building an Ecosystem', text: 'Started building Skill-Building courses for the untapped India.' },
]

const MEET_ROHIT = [
  'Rohit Gala knows what it feels like to choose a career without guidance. Like many students, he spent years trying different paths before finding the one that fit. He didn’t let that experience go to waste. It became the reason he started Svastrino, with one clear mission — no student should have to struggle the way he did.',
  'Rohit trained properly for this work. He holds a Diploma in Counselling Psychology and a Master’s in Sociology, which made him one of the few licensed career and education counsellors in India. Within four years, he had built a personalised career mentoring program running across the country.',
  'His understanding of careers didn’t come from books alone. He has spent years talking to professors, corporate leaders, entrepreneurs, and consultants, building a real picture of what different fields actually demand.',
  'He hasn’t stopped learning either. He later completed a Diploma in Introduction to Psychology from Yale University, scoring 97.05%.',
  'Rohit still works the same way he did on day one — understand the student first, and let the career plan follow from that. What drives him now is bigger than one student at a time. He wants a generation that chooses its own path, instead of settling for whatever was expected of them.',
]

const TEAM = [
  { name: 'Rohit Gala', role: 'Founder & Chief Career Mentor', years: '17+ years', photo: '/assets/images/team/rohit-gala.png', linkedin: null },
  { name: 'Miloni Gala', role: 'Administrative Manager', years: '10+ years', photo: '/assets/images/team/miloni-gala.png', linkedin: null },
  { name: 'Divya Shah', role: 'Recruitments', years: '10+ years', photo: '/assets/images/team/divya-shah.png', linkedin: null },
  { name: 'Vanshika Parmar', role: 'Creative Head', years: '4+ years', photo: '/assets/images/team/vanshika-parmar.png', linkedin: null },
  { name: 'Pooja Gindra', role: 'Legal Consultant', years: '5+ years', photo: '/assets/images/team/pooja-gindra.png', linkedin: null },
  { name: 'Ravindra Yadav', role: 'Technical Consultant & Developer', years: '10+ years', photo: '/assets/images/team/ravi.png', linkedin: null },
]

const SERVICES = [
  { need: 'For Immediate Career Counselling', label: "Bull's Eye Program", to: '/services/bulls-eye' },
  { need: 'Choosing career through Deep Self-Reflection', label: 'Bloom Program', to: '/services/bloom' },
  { need: 'To Transform Completely through Long-Term Mentoring', label: 'Breakthrough Program', to: '/services/breakthrough' },
  { need: 'To Build Skills and Yourself', label: 'Nirmaan', to: '/skill-build/nirmaan' },
  { need: 'To verify your potential & career Scientifically', label: 'Psychometric Testing', to: '/skill-build/psychometric-testing' },
]

const initials = (n) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

export default function About() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="About Svastrino"
        subtitle="At Svastrino, we believe you cannot build a successful career without first building yourself. We help individuals understand themselves, build the right skills and mindset, and make confident career decisions."
      />

      {/* ---- Our story ---- */}
      <section className="bg-white py-16 md:py-20">
        <div className="container grid items-start gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-brand-navy">
              Our story
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-brand-slate">
              In 2009, Svastrino began with 20 students and a simple belief that choosing a career
              should be about more than marks, trends, or what others expect from you. Over the past
              17 years, we saw that building the right career is only one part of the journey. What
              truly shapes that journey is the person behind the choice: their mindset, strengths,
              skills, confidence, and ability to grow. That understanding became the foundation of
              Svastrino and continues to shape what we do today.
            </p>
          </div>

          {/* Origin image */}
          <img
            src="/assets/images/our-story.png"
            alt="The Svastrino story — from 20 students in 2009 to today"
            loading="lazy"
            className="w-full rounded-2xl object-cover shadow-xl shadow-brand-navy/10"
          />
        </div>
      </section>

      {/* ---- Vision & mission ---- */}
      <section className="bg-soft py-16 md:py-20">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-brand-navy/5 bg-white p-7 shadow-sm">
              <h3 className="font-display text-xl font-bold text-brand-navy">Our Mission</h3>
              <p className="mt-3 leading-relaxed text-brand-slate">
                To provide accessible, structured, and continuous career development through online
                skill-building, career counselling, and mentoring that is practical, personalised,
                and future-ready.
              </p>
            </div>
            <div className="rounded-xl border border-brand-navy/5 bg-white p-7 shadow-sm">
              <h3 className="font-display text-xl font-bold text-brand-navy">Our Vision</h3>
              <p className="mt-3 leading-relaxed text-brand-slate">
                To create a generation of confident, capable and self-directed individuals who can
                shape their own success stories through Svastrino&rsquo;s career development ecosystem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Milestones ---- */}
      <section className="bg-white py-16 md:py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-brand-navy">
              How we got here!
            </h2>
            <ol className="mt-8 space-y-6 border-l-2 border-brand-crimson/20 pl-6">
              {MILESTONES.map((m) => (
                <li key={m.year} className="relative">
                  <span className="absolute -left-[1.95rem] top-1 flex size-4 items-center justify-center rounded-full border-2 border-brand-crimson bg-white" />
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="font-display text-lg font-bold text-brand-crimson">{m.year}</span>
                    <span className="font-display text-base font-bold text-brand-navy">{m.title}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-brand-slate">{m.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---- Ideology strip ---- */}
      <section className="bg-brand-crimson/5 py-10">
        <div className="container flex flex-col items-center justify-center gap-4 text-center sm:flex-row">
          <p className="text-lg font-medium text-brand-navy">
            Our effective mentoring is rooted in our detailed, personal and strong roots.
          </p>
          <Link
            to="/our-ideology"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-brand-crimson px-6 text-sm font-semibold text-brand-crimson transition-colors hover:bg-brand-crimson hover:text-white"
          >
            Our Ideology <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* ---- Media recognition ---- */}
      <section className="bg-white py-16 md:py-20">
        <div className="container text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-crimson">
            Media recognition
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-navy">
            Reflections of our impact through National Newspapers
          </h2>
          <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border border-brand-navy/10 shadow-sm">
            <img
              src="/assets/images/newspaper-recognition.jpg"
              alt="Svastrino featured in national newspapers"
              loading="lazy"
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* ---- Meet Rohit Gala ---- */}
      <section className="bg-soft py-16 md:py-20">
        <div className="container grid items-start gap-10 md:grid-cols-[260px_1fr]">
          <div>
            <img
              src={FOUNDER_IMG}
              alt="Rohit M. Gala, founder of Svastrino"
              loading="lazy"
              className="w-full rounded-2xl object-cover"
            />
            <h3 className="mt-4 font-display text-xl font-bold text-brand-navy">Rohit M. Gala</h3>
            <p className="mt-0.5 text-sm font-semibold text-brand-crimson">
              Founder &amp; Chief Career Mentor · 17+ years
            </p>
          </div>
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-brand-navy">
              Meet Rohit Gala
            </h2>
            <div className="mt-5 space-y-4 leading-relaxed text-brand-slate">
              {MEET_ROHIT.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---- Our team ---- */}
      <section className="bg-white py-16 md:py-20">
        <div className="container">
          <h2 className="text-center font-display text-3xl font-extrabold tracking-tight text-brand-navy">
            Our Team
          </h2>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2 md:grid-cols-3">
            {TEAM.map((m) => (
              <div
                key={m.name}
                className="flex flex-col items-center rounded-xl border border-brand-navy/5 bg-white p-6 text-center shadow-sm"
              >
                <div className="flex size-60 items-center justify-center overflow-hidden rounded-full bg-brand-rose font-display text-2xl font-bold text-brand-crimson">
                  {m.photo ? (
                    <img src={m.photo} alt={m.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <span aria-hidden>{initials(m.name)}</span>
                  )}
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-brand-navy">
                  {m.linkedin ? (
                    <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-brand-crimson">
                      {m.name}
                    </a>
                  ) : (
                    m.name
                  )}
                </h3>
                <p className="mt-1 text-sm text-brand-slate">{m.role}</p>
                {m.years && <p className="mt-0.5 text-xs text-brand-slate">{m.years}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Explore services strip ---- */}
      <section className="bg-soft py-16 md:py-20">
        <div className="container">
          <h2 className="mx-auto max-w-2xl text-center font-display text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl">
            Now that you know us, let us assist in exploring our services
          </h2>
          <ul className="mx-auto mt-10 max-w-2xl divide-y divide-brand-navy/10">
            {SERVICES.map((r) => (
              <li key={r.to} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <span className="text-brand-navy">{r.need}</span>
                <Link
                  to={r.to}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-brand-crimson hover:underline"
                >
                  {r.label} <ArrowRight className="size-4" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
