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
  { label: "No. of Sessions", values: ["2 Sessions", "3 Sessions", "10 Sessions of 2.5 Hours Each, Or 20 Sessions of 1 To 1.5 Hour Each (depending on the Student's pace)"] },
  { label: "Total Time", values: ["About 5 Hours", "About 10 Hours", "About 36 Hours"] },
  { label: "Purpose", values: ["Immediate Career Counselling", "Career Decision Through Deep Self Reflection", "Personalised Mentoring for Overall Transformation (Life & Career)"] },
  { label: "Follow-Ups", values: ["Once", "Weekly, Until Program Ends", "Weekly, Until Program Ends"] },
]

/** What each program includes. true = included, false = not part of it. */
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
  { label: "5 Year Career plan", has: [false, true, true] },
  { label: "Developing a Strong Mindset", has: [false, true, true] },
  { label: "Personal Mentoring", has: [false, true, true] },
  { label: "Leadership Development", has: [false, false, true] },
  { label: "Entrepreneur Development", has: [false, false, true] },
  { label: "Consistent Checks and Mentoring", has: [false, false, true] },
  { label: "Encouraging Students to Attempt", has: [false, false, true] },
  { label: "Encouraging Students to Experience & Accept Results", has: [false, false, true] },
  { label: "Pushing Students to Grow Continuously", has: [false, false, true] },
  { label: "Nurturing While Germinating", has: [false, false, true] },
  { label: "Micro Managing the Progress", has: [false, false, true] },
  { label: "Simulation Based Training", has: [false, false, true] },
  { label: "Developing Habit of Persistent Effort", has: [false, false, true] },
  { label: "Driving Purpose of Life", has: [false, false, true] },
  { label: "Guidance on Secret Success Mantra", has: [false, false, true] },
  { label: "Developing Leaders Surrounding", has: [false, false, true] },
  { label: "Transforming Students into Future Leaders", has: [false, false, true] },
  { label: "Developing Self-learning Mindset", has: [false, false, true] },
]
