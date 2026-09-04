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
      'Your Start Doesn’t Define Your End',
      'Discover Your Strengths & What Makes You, You',
      'Understand Your Inner Voice & How It Shapes You',
      'Understand Your Value & Define Your Own Success',
    ],
  },
  {
    n: 2, name: 'Building the Success Engine',
    weeks: [
      'Build Confidence Through Small Daily Improvements',
      'Face Your Fears Instead of Letting Them Hold You Back',
      'Learn to Communicate With Confidence',
      'Build Discipline Even When Motivation Is Missing',
    ],
  },
  {
    n: 3, name: 'Inner Growth Through Winning',
    weeks: [
      'Learn From Failure & Keep Trying',
      'Learn to Trust Yourself & Your Decisions',
      'Build Inner Strength to Handle Setbacks',
      'Take Calculated Risks to Grow',
    ],
  },
  {
    n: 4, name: 'Building Self',
    weeks: [
      'Shift From a Fixed Mindset to a Growth Mindset',
      'Learn to Unlearn, Relearn & Keep Growing',
      'Learn How to Combine Work Hard With Work Smart',
      'Keep Learning Beyond the Classroom',
    ],
  },
  {
    n: 5, name: 'Being Emotionally and Mentally Grounded',
    weeks: [
      'Learn to Handle Stress Without Losing Control',
      'Understand Your Emotions & Respond Wisely',
      'Adapt to Change Without Losing Yourself',
      'Turn Consistency Into Your Superpower',
    ],
  },
  {
    n: 6, name: 'Building the Success Blueprint',
    weeks: [
      'Create a Career Roadmap That Fits You',
      'Turn Your Goals Into a 5-Year Growth Plan',
      'Build the Skills to Succeed Anywhere',
      'Create Your Personal Blueprint for Success',
    ],
  },
]

export default function Journey() {
  const [open, setOpen] = useState(1) // first phase open, so the shape is obvious

  return (
    <section id="journey" className="bg-white py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-nirmaan-green">Course Journey</p>
          <h2 className="capitalize mt-3 font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown sm:text-4xl">
            Your Transformative Journey through the course
          </h2>
          <p className="mt-4 text-lg text-nirmaan-brown-soft">
            {/* A commitment of at most 15 minutes a day for the next 24 weeks — one weekly video, then one short task on each of the next six days. */}
            A commitment of at most 15 minutes a day for the next 24 weeks
            <br />(Combination of 1 weekly video + 1 daily task for the next 6 days of the week)
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          {PHASES.map((p, i) => {
            const isOpen = open === p.n
            const firstWeek = (p.n - 1) * 4 + 1
            return (
              <div
                key={p.n}
                className={`rounded-xl border bg-white shadow-sm transition-colors ${
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
                  <ul
                    // start={firstWeek}
                    className="space-y-1.5 border-t border-nirmaan-sand px-6 py-4 pl-10 text-sm text-nirmaan-brown marker:font-semibold marker:text-nirmaan-green"
                  >
                    {p.weeks.map((w, j) => <li key={w} className="pl-0"><span className={`text-nirmaan-green font-semibold`}>Week {p.n*4-4+j+1}</span>: {w}</li>)}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
