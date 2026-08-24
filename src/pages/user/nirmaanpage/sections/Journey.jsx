import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'

/**
 * Nirmaan · "Your Transformative Journey" — the whole 24-week course laid out
 * as six phases. Phases open and close on click so the page stays scannable.
 *
 * These six phases are the SAME six the pay-as-you-use plan sells one at a
 * time, so a student can see exactly what each payment opens.
 */
const PHASES = [
  {
    n: 1, name: 'Self Awareness',
    weeks: [
      'Start ≠ End',
      'Your Life Project Begins Now (Discover Your Strengths)',
      'The Identity Shift (Your Inner Voice)',
      'Design Your Personal Success Story (Understanding Your Value)',
    ],
  },
  {
    n: 2, name: 'Building the Success Engine',
    weeks: [
      'Confidence Is Built, Not Born (Daily 1% Improvement Formula: Being Disciplined Without Motivation)',
      'Overcoming Fear Of Any Kind',
      'Communicate With Confidence',
      'Discipline Is More Powerful Than Motivation',
    ],
  },
  {
    n: 3, name: 'Inner Growth Through Winning',
    weeks: [
      'Fail To Train Well (Why Trying Matters More Than Winning)',
      'Being Courageous To Trust Yourself',
      'Building Resilience (Inner Strength)',
      'Risk Taking For Growth',
    ],
  },
  {
    n: 4, name: 'Building Self',
    weeks: [
      'Fixed Mindset Vs Growth Mindset',
      'Learning How To Unlearn & Relearn',
      'Hard Work + Smart Work',
      'Learning Beyond School',
    ],
  },
  {
    n: 5, name: 'Being Emotionally and Mentally Grounded',
    weeks: [
      'Handling Stress',
      'Respond Wisely (Emotional Intelligence)',
      'Adaptability In A Changing World',
      'The Power Of Consistency',
    ],
  },
  {
    n: 6, name: 'Building the Success Blueprint',
    weeks: [
      'Designing Your Career Roadmap',
      'Your 5-Year Growth Plan',
      'Becoming Successful Anywhere',
      'The Personal Success Blueprint',
    ],
  },
]

export default function Journey() {
  const [open, setOpen] = useState(1) // first phase open, so the shape is obvious

  return (
    <section id="journey" className="bg-white py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-nirmaan-green">Your journey</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown sm:text-4xl">
            Your Transformative Journey through the course
          </h2>
          <p className="mt-4 text-lg text-nirmaan-brown-soft">
            A commitment of at most 15 minutes a day for the next 24 weeks — one weekly video,
            then one short task on each of the next six days.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          {PHASES.map((p) => {
            const isOpen = open === p.n
            const firstWeek = (p.n - 1) * 4 + 1
            return (
              <div
                key={p.n}
                className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-colors ${
                  isOpen ? 'border-nirmaan-green/40' : 'border-nirmaan-sand'
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : p.n)}
                  className="flex w-full cursor-pointer items-center gap-3 p-4 text-left sm:gap-4 sm:p-5"
                >
                  <span className="shrink-0 rounded-full bg-nirmaan-green/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-nirmaan-green">
                    Phase {p.n}
                  </span>
                  <span className="flex-1 font-display font-bold text-nirmaan-brown">{p.name}</span>
                  <span className="hidden shrink-0 text-xs font-semibold text-nirmaan-brown-soft sm:block">
                    Weeks {firstWeek}–{firstWeek + 3}
                  </span>
                  <span className="shrink-0 text-nirmaan-green">
                    {isOpen ? <Minus className="size-5" /> : <Plus className="size-5" />}
                  </span>
                </button>

                {isOpen && (
                  <ol
                    start={firstWeek}
                    className="list-decimal space-y-1.5 border-t border-nirmaan-sand px-6 py-4 pl-10 text-sm text-nirmaan-brown marker:font-semibold marker:text-nirmaan-green"
                  >
                    {p.weeks.map((w) => <li key={w} className="pl-1">{w}</li>)}
                  </ol>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
