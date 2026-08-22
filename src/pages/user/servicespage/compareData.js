/**
 * The three counselling and mentoring programs, side by side. Content comes
 * from the comparison matrix in the planning sheet.
 */
export const PROGRAMS = [
  { name: "Bull's Eye Program", slug: 'bulls-eye', category: 'Career Counselling' },
  { name: 'Bloom Program', slug: 'bloom', category: 'Personalised Mentoring' },
  // expertCall: sold after a conversation, so its button opens the call-back
  // form on its own page rather than the booking wizard.
  { name: 'Breakthrough Program', slug: 'breakthrough', category: 'Personalised Mentoring', expertCall: true },
]

/** The headline facts — shown as words, not ticks. */
export const DETAILS = [
  { label: "Duration", values: ["10 Days", "2 Months", "2 Years"] },
  { label: "No of Sessions", values: ["3 sessions x 2 hours", "5 sessions x 2 hours", "22 sessions x 2 hours (at your own pace)"] },
  { label: "Total Time Inclusion", values: ["~5 hours through the process", "~10 hours through the process", "~45 hours through the process"] },
  { label: "Purpose", values: ["Immediate Career Counselling", "Career Decision through Deep Self Reflection", "Personalised Mentoring for Overall Transformation (Life & Career)"] },
  { label: "Follow ups", values: ["Once", "Weekly till Program Ends", "Weekly till Program Ends"] },
]

/** What each programme includes. true = included, false = not part of it. */
export const CAPABILITIES = [
  { label: "For Students", has: [true, true, true] },
  { label: "Career Guidance & Planning", has: [true, true, true] },
  { label: "Global Career Guidance", has: [true, true, true] },
  { label: "Personality Evaluation & Introspection", has: [true, true, true] },
  { label: "Vision Check", has: [true, true, true] },
  { label: "Background Check", has: [true, true, true] },
  { label: "Vision Development", has: [false, true, true] },
  { label: "Deep Self Realisation", has: [false, true, true] },
  { label: "Task Based Development", has: [false, true, true] },
  { label: "5 year Career plan", has: [false, true, true] },
  { label: "Developing a Strong Mindset", has: [false, true, true] },
  { label: "Personal Mentoring", has: [false, true, true] },
  { label: "Leadership Development", has: [false, false, true] },
  { label: "Entrepreneur Development", has: [false, false, true] },
  { label: "Consistent Checks and Mentoring", has: [false, false, true] },
  { label: "Encouraging Students to Attempt", has: [false, false, true] },
  { label: "Encouraging Students to Experience & Accept Results", has: [false, false, true] },
  { label: "Pushing Students to Grow Continuously", has: [false, false, true] },
  { label: "Nurturing while Germinating", has: [false, false, true] },
  { label: "Micro Managing the Progress", has: [false, false, true] },
  { label: "Simulation Based Training", has: [false, false, true] },
  { label: "Developing Habit of Persistent Effort", has: [false, false, true] },
  { label: "Driving Purpose of Life", has: [false, false, true] },
  { label: "Guidance on Secret Success Mantra", has: [false, false, true] },
  { label: "Developing Leaders Surrounding", has: [false, false, true] },
  { label: "Transforming students into Future Leaders", has: [false, false, true] },
  { label: "Developing self learning mindset", has: [false, false, true] },
]
