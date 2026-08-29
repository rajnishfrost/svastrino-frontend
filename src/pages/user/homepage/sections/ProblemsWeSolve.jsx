import { AlertTriangle, ExternalLink, HelpCircle, Lightbulb } from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'

/**
 * Home · section 2 — "Problems We Solve".
 * A hard statistic paired with what we do about it, three times over. The
 * numbers do the persuading; the second line answers them.
 */
const POINTS = [
  {
    icon: HelpCircle,
    stat: 'Only 10.4 % of Indian students receive professional career guidance',
    answer:
      'We help you Understand Yourself by identifying your natural Strengths, Talents, and Values so you can make choices that feel right for you.',
    sourceLink: "https://www.deccanherald.com/india/only-10-of-indian-students-receive-career-guidance-study-3743428"
  },
  {
    icon: AlertTriangle,
    stat: '86% of Indian students lack career clarity or regret their choices',
    answer:
      'We help you Explore Diverse Careers early, Build Confidence, and make Informed Choices beyond peer pressure and expectations.',
    sourceLink: "https://www.linkedin.com/posts/khushbuchopda_careerawareness-careerexploration-careercounseling-activity-7358823695131299840-gsvG"
  },
  {
    icon: Lightbulb,
    stat: "77% of students admit they'd engage more in education if they understood career options",
    answer:
      'We provide Regular Personal and Professional Development support to turn career awareness into practical skills and action.',
    sourceLink: "https://skillpointe.com/news-and-advice/incredible-impact-career-counseling-students"
  },
]

export default function ProblemsWeSolve() {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="container">
        <SectionHeading title="Problems We Solve" />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {/* {POINTS.map((p) => (
            <div
              key={p.stat}
              className="flex flex-col rounded-xl border border-brand-navy/5 bg-white p-7 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-navy/5"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-brand-rose text-brand-crimson">
                <p.icon className="size-6" />
              </span>
              <h3 className="mt-5 font-display text-base font-bold leading-snug text-brand-navy">
                {p.stat}
              </h3>
              <div className="mt-4 rounded-lg border-l-[3px] border-brand-crimson bg-brand-rose p-3.5">
                <p className="text-sm font-medium leading-relaxed text-brand-navy">{p.answer}</p>
              </div>
              {p.sourceLink && (
                <a
                  href={p.sourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-1 self-start pt-4 text-xs font-medium text-brand-crimson underline-offset-2 transition-colors hover:text-brand-crimson hover:underline"
                >
                  View Article <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          ))} */}
          <div
            className="flex flex-col rounded-xl border border-brand-navy/5 bg-white p-7 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-navy/5"
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-brand-rose text-brand-crimson">
              <HelpCircle className="size-6" />
            </span>
            <h3 className="mt-5 font-display text-base font-bold leading-snug text-brand-navy">
              We help you Understand Yourself by identifying your natural Strengths, Talents, and Values so you can make choices that feel right for you.
            </h3>
            <div className="mt-4 rounded-lg border-l-[3px] border-brand-crimson bg-brand-rose p-3.5">
              <p className="text-sm font-medium leading-relaxed text-brand-navy">We help you <span className={`text-brand-crimson`}>Understand Yourself</span> by identifying your natural <span className={`text-brand-crimson`}>Strengths, Talents, and Values</span> so you can make choices that feel right for you.</p>
            </div>
            <a
              href={"https://www.deccanherald.com/india/only-10-of-indian-students-receive-career-guidance-study-3743428"}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center gap-1 self-start pt-4 text-xs font-medium text-brand-crimson underline-offset-2 transition-colors hover:text-brand-crimson hover:underline"
            >
              View Article <ExternalLink className="size-3" />
            </a>
          </div>
          <div
            className="flex flex-col rounded-xl border border-brand-navy/5 bg-white p-7 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-navy/5"
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-brand-rose text-brand-crimson">
              <AlertTriangle className="size-6" />
            </span>
            <h3 className="mt-5 font-display text-base font-bold leading-snug text-brand-navy">
              86% of Indian students lack career clarity or regret their choices
            </h3>
            <div className="mt-4 rounded-lg border-l-[3px] border-brand-crimson bg-brand-rose p-3.5">
              <p className="text-sm font-medium leading-relaxed text-brand-navy">We help you <span className={`text-brand-crimson`}>Explore Diverse Careers</span> early, <span className={`text-brand-crimson`}>Build Confidence</span>, and make <span className={`text-brand-crimson`}>Informed Choices</span> beyond peer pressure and expectations.</p>
            </div>
            <a
              href={"https://www.linkedin.com/posts/khushbuchopda_careerawareness-careerexploration-careercounseling-activity-7358823695131299840-gsvG"}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center gap-1 self-start pt-4 text-xs font-medium text-brand-crimson underline-offset-2 transition-colors hover:text-brand-crimson hover:underline"
            >
              View Article <ExternalLink className="size-3" />
            </a>
          </div>
          <div
            className="flex flex-col rounded-xl border border-brand-navy/5 bg-white p-7 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-navy/5"
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-brand-rose text-brand-crimson">
              <Lightbulb className="size-6" />
            </span>
            <h3 className="mt-5 font-display text-base font-bold leading-snug text-brand-navy">
              77% of students admit they'd engage more in education if they understood career options
            </h3>
            <div className="mt-4 rounded-lg border-l-[3px] border-brand-crimson bg-brand-rose p-3.5">
              <p className="text-sm font-medium leading-relaxed text-brand-navy">We provide Regular <span className={`text-brand-crimson`}>Personal and Professional Development</span> support to turn career awareness into practical skills and action.</p>
            </div>
            <a
              href={"https://skillpointe.com/news-and-advice/incredible-impact-career-counseling-students"}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center gap-1 self-start pt-4 text-xs font-medium text-brand-crimson underline-offset-2 transition-colors hover:text-brand-crimson hover:underline"
            >
              View Article <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
