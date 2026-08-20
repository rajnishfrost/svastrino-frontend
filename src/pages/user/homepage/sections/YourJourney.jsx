import SectionHeading from './SectionHeading.jsx'

/**
 * Home · section 4 — "Your Journey in 5 Simple Steps".
 * A left-to-right strip that shows the whole arc at a glance, so the visitor
 * understands what working with us actually looks like before they commit.
 */
const STEPS = [
  { label: 'Discover', text: 'Know yourself, interests & potential' },
  { label: 'Understand', text: 'Gain career clarity & direction' },
  { label: 'Build', text: 'Develop mindset, skills & profile' },
  { label: 'Experience', text: 'Apply learning through real opportunities' },
  { label: 'Progress', text: 'Make confident decisions and progress towards success' },
]

export default function YourJourney() {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="container">
        <SectionHeading title="Your Journey in 5 Simple Steps" />

        <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.label} className="text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-crimson font-display text-lg font-bold text-white shadow-lg shadow-brand-crimson/25">
                {i + 1}
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-brand-navy">
                {s.label} <span className="text-brand-crimson">&rarr;</span>
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-brand-slate">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
