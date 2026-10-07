import { Check, FileText } from 'lucide-react'

/**
 * Psychometric · What You'll Get — the report each test produces, so a family
 * knows what they are paying for before they choose. The two reports follow the
 * two tests: Stream Selector for classes 7 to 9, Career Selector for 10 to 12.
 *
 * `yourTest` (the test for the signed-in student's class, when known) tags that
 * card "Your report", the same way the test cards below tag "Your test".
 */
const REPORTS = [
  {
    test: 'Stream Selector',
    name: 'Stream Selector Report',
    who: 'Class 7–9',
    points: [
      'See your strengths in 4 areas: Orientation Style, Interest, Personality and Aptitude',
      'Find your top 5 subject interests',
      'Learn about 15 personality traits and 7 skills, with tips to improve each one',
      'Discover the 2 streams that suit you best',
      "Know what you'll study in each stream and where it can take you",
    ],
  },
  {
    test: 'Career Selector',
    name: 'Career Selector Report',
    who: 'Class 10–12',
    points: [
      'See your strengths in 5 areas: Orientation Style, Interest, Personality, Aptitude and Emotional Quotient',
      'Find your top 5 career interests',
      'Learn about 15 personality traits, 10 skills and 7 emotional strengths, with tips to grow each one',
      'Discover the 5 careers that suit you best',
      'Know the skills, colleges and entrance exams you need for each career',
    ],
  },
]

export default function WhatYouGet({ yourTest = null }) {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown sm:text-4xl">
            What You&rsquo;ll Get
          </h2>
          <p className="mt-4 text-lg text-nirmaan-brown-soft">
            A detailed personal report, along with videos that help you understand your results.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          {REPORTS.map((r) => {
            const mine = yourTest === r.test
            return (
              <div
                key={r.name}
                className={`relative flex flex-col rounded-xl border border-solid bg-white p-7 shadow-[0_12px_32px_-10px_rgba(59,40,34,0.25)] ${
                  mine ? 'border-nirmaan-green/50' : 'border-nirmaan-sand'
                }`}
              >
                {mine && (
                  <span className="absolute right-5 top-5 rounded-full bg-nirmaan-green px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    Your report
                  </span>
                )}
                <span className="flex size-12 items-center justify-center rounded-xl bg-nirmaan-green/10 text-nirmaan-green">
                  <FileText className="size-6" aria-hidden />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold text-nirmaan-brown">{r.name}</h3>
                <p className="mt-1 text-sm font-semibold text-nirmaan-green">{r.who}</p>
                <ul className="mt-5 space-y-3">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm leading-relaxed text-nirmaan-brown">
                      <Check className="mt-0.5 size-4 shrink-0 text-nirmaan-green" aria-hidden />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
