import { AlertTriangle, HelpCircle, Lightbulb } from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'

/**
 * Home · section 2 — "Problems We Solve".
 * A hard statistic paired with what we do about it, three times over. The
 * numbers do the persuading; the second line answers them.
 */
const POINTS = [
  {
    icon: HelpCircle,
    stat: 'Only 10.4% of Indian students ever receive professional career guidance.',
    answer:
      'We help you understand yourself by identifying your natural strengths, talents, and values so you can make choices that feel right for you.',
  },
  {
    icon: AlertTriangle,
    stat: 'Approximately 86% of Indian students regret their career choices or lack clarity about their professional paths.',
    answer:
      'We help you explore diverse career paths early, build confidence, and make informed choices beyond peer pressure and expectations.',
  },
  {
    icon: Lightbulb,
    stat: '77% of students admit that they would engage more deeply with education if they understood practical career options.',
    answer:
      'We provide you with regular personal and career development support to turn career awareness into practical skills and action.',
  },
]

export default function ProblemsWeSolve() {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="container">
        <SectionHeading title="Problems We Solve" />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {POINTS.map((p) => (
            <div
              key={p.stat}
              className="rounded-xl border border-brand-navy/5 bg-white p-7 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-navy/5"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-brand-rose text-brand-crimson">
                <p.icon className="size-6" />
              </span>
              <h3 className="mt-5 font-display text-base font-bold leading-snug text-brand-navy">
                {p.stat}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-brand-slate">{p.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
