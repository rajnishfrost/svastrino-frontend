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
    n: 1,
    name: 'Self Awareness',
    weeks: [
      // 'Your Start Doesn’t Define Your End',
      // 'Discover Your Strengths & What Makes You, You',
      // 'Understand Your Inner Voice & How It Shapes You',
      // 'Understand Your Value & Define Your Own Success',
      {text: "Start ≠ End",
      subText: "Your start doesn't define your end"},
      {text: "Your Life Project Begins Now",
      subText: "Discover your strengths & what makes you, you"},
      {text: "The Identity Shift",
      subText: "Discover your inner voice & how it shapes you"},
      {text: "Design Your Personal Success Story",
      subText: "Understand your value & define your own success"},
    ],
  },
  {
    n: 2,
    name: 'Building the Success Engine',
    weeks: [
      // 'Build Confidence Through Small Daily Improvements',
      // 'Face Your Fears Instead of Letting Them Hold You Back',
      // 'Learn to Communicate With Confidence',
      // 'Build Discipline Even When Motivation Is Missing',
      {text: "Confidence Is Built, Not Born",
      subText: "Build confidence through small daily improvements"},
      {text: "Overcoming Fear Of Any Kind",
      subText: "Face your fears instead of letting them hold you back"},
      {text: "Communicate With Confidence",
      subText: "Learn to communicate your thoughts clearly and confidently"},
      {text: "Discipline Is More Powerful Than Motivation",
      subText: "Build the discipline to keep moving forward, even when motivation is missing"},
    ],
  },
  {
    n: 3,
    name: 'Inner Growth Through Winning',
    weeks: [
      // 'Learn From Failure & Keep Trying',
      // 'Learn to Trust Yourself & Your Decisions',
      // 'Build Inner Strength to Handle Setbacks',
      // 'Take Calculated Risks to Grow',
      {text: "Fail To Train Well",
      subText: "Learn from failure & keep trying"},
      {text: "Being Courageous To Trust Yourself",
      subText: "Build the courage to listen to yourself and make confident choices"},
      {text: "Building Resilience",
      subText: "Develop inner strength to bounce back from setbacks"},
      {text: "Risk Taking For Growth",
      subText: "Learn to step out of your comfort zone and make thoughtful choices"},
    ],
  },
  {
    n: 4,
    name: 'Building Self',
    weeks: [
      // 'Shift From a Fixed Mindset to a Growth Mindset',
      // 'Learn to Unlearn, Relearn & Keep Growing',
      // 'Learn How to Combine Work Hard With Work Smart',
      // 'Keep Learning Beyond the Classroom',
      {text: "Fixed Mindset Vs Growth Mindset",
      subText: "Learn to embrace challenges and see mistakes as opportunities to improve"},
      {text: "Learning How To Unlearn & Relearn",
      subText: "Challenge old beliefs, stay open to new ideas, and keep evolving"},
      {text: "Hard Work + Smart Work",
      subText: "Learn to work with greater focus, efficiency, and purpose"},
      {text: "Learning Beyond School",
      subText: "Discover how everyday experiences can become opportunities to learn and grow"},
    ],
  },
  {
    n: 5, name: 'Being Emotionally and Mentally Grounded',
    weeks: [
      // 'Learn to Handle Stress Without Losing Control',
      // 'Understand Your Emotions & Respond Wisely',
      // 'Adapt to Change Without Losing Yourself',
      // 'Turn Consistency Into Your Superpower',
      {text: "Handling Stress",
      subText: "Learn to manage stress without losing control"},
      {text: "Respond Wisely",
      subText: "Understand your emotions & choose how you respond"},
      {text: "Adaptability In A Changing World",
      subText: "Learn to embrace change while staying true to who you are"},
      {text: "The Power Of Consistency",
      subText: "Discover how small, repeated actions can create lasting results"},
    ],
  },
  {
    n: 6, name: 'Building the Success Blueprint',
    weeks: [
      // 'Create a Career Roadmap That Fits You',
      // 'Turn Your Goals Into a 5-Year Growth Plan',
      // 'Build the Skills to Succeed Anywhere',
      // 'Create Your Personal Blueprint for Success',
      {text: "Designing Your Career Roadmap",
      subText: "Turn your strengths, interests, and goals into a clear career direction"},
      {text: "Your 5-Year Growth Plan",
      subText: "Set meaningful milestones to guide your personal and professional growth"},
      {text: "Becoming Successful Anywhere",
      subText: "Develop the mindset and abilities to thrive in any environment"},
      {text: "The Personal Success Blueprint",
      subText: "Bring everything you've learned together into your own plan for success"},
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
            Your Transformative Journey Through the course
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
                    className="space-y-1.5 border-t border-nirmaan-sand px-4 py-4 text-sm text-nirmaan-brown marker:font-semibold marker:text-nirmaan-green"
                  >
                    {p.weeks.map((w, j) => (
                      <li key={w} className="pl-0 flex justify-start items-start gap-3">
                        <div className={`text-nirmaan-green font-semibold whitespace-nowrap`}>Week {p.n*4-4+j+1} :</div>
                        <div className={``}>
                          <span className={`font-semibold`}>{w.text}</span><br/>
                          <span>{w.subText}</span>
                          {/* {w} */}

                        </div>
                      </li>
                    ))}
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
