/**
 * Program journeys, clubbed by STAGE. Sourced from each program's content
 * sheet (src/content/<slug>.md → the "Program Journey" sections). Kept in the
 * frontend for now because the backend journey is a flatter, thinner version;
 * this is the richer, stage-grouped content the pages should show.
 *
 * Shape:
 *   stages: [{
 *     title,            // stage name (omit for an unlabelled group)
 *     range,            // when it happens (day / minute span)
 *     note,             // optional caveat shown under the header
 *     steps: [{
 *       title,          // step name (omit → the step's points render as a plain list)
 *       range,          // optional day for this step
 *       points: []      // what happens in the step
 *     }]
 *   }]
 *   closing             // optional closing line under the stages
 */
export const PROGRAM_JOURNEYS = {
  'bulls-eye': {
    subtitle: "Our Bull's Eye Program provides a step-by-step process to understand your profile, explore your options, and finalise your career direction.",
    stages: [
      {
        title: 'Pre-session',
        range: 'Day 1 · 0–90 min',
        steps: [
          {
            points: [
              'Analysis of your background, academics, and personal development so far',
              'Organising your details for a productive counselling session',
            ],
          },
        ],
      },
      {
        title: 'Actual Session',
        range: 'Day 3 · 91–240 min',
        steps: [
          {
            title: 'Getting to know you',
            points: [
              'Identifying personality, strengths, background, and career interests',
              'Recognising your unique potential and natural talents & abilities',
            ],
          },
          {
            title: 'Addressing your core needs',
            points: [
              'Personalised career guidance for your specific concerns and needs',
              'Understanding your vision, goals, and aspirations',
            ],
          },
          {
            title: 'Streamlining your goals',
            points: [
              'Clarifying and prioritising your ideas and ambitions',
              'Building a long-term vision for career success',
            ],
          },
          {
            title: 'Guiding your ideal career match',
            points: [
              'Recommending careers that align with your personality and vision',
              'Exploring futuristic and high-growth career options',
              'Creating a personalised career plan just for you',
              'Solving all your career confusions',
            ],
          },
        ],
      },
      {
        title: 'Post-session',
        range: 'Day 10 · 241–300 min',
        steps: [
          {
            points: [
              'Follow-up session one week after your career session',
              'Finalising your career choice and clearing new doubts',
              'Expert guidance to confidently pursue your career path',
            ],
          },
        ],
      },
    ],
  },

  bloom: {
    subtitle: "The Bloom journey helps you understand yourself, build your vision and create a clear path forward",
    stages: [
      {
        title: 'Pre-session',
        range: 'Day 1 · 0–90 min',
        steps: [
          {
            points: [
              'Analysis of your background, academics, and personal development so far',
              'Organising all details for the planned personalised mentoring program',
            ],
          },
        ],
      },
      {
        title: 'Actual Sessions',
        range: 'Day 3–60 · 91–540 min',
        steps: [
          {
            title: 'Complete Personality Analysis',
            range: 'Day 3',
            points: [
              'Understanding your personal, academic, emotional, and social growth',
              'Exploring the mindsets, patterns, habits, and choices that shaped you',
              'Deep self-reflection through personal questions & concepts',
              'Guidance on ways to evolve naturally',
            ],
          },
          {
            title: 'Tailored Tasks for Self-Discovery',
            range: 'Day 4–20',
            points: [
              'Tasks designed to uncover your hidden strengths',
              'Sharpening focus and restoring inner balance',
              'Reconnecting with your true self with confidence',
              'Regular check-ins to track your progress',
            ],
          },
          {
            title: 'Developing Your Vision & Winning Attitude',
            range: 'Day 21',
            points: [
              'Recognising you, your personality & your uniqueness',
              'Building together a vision that’s clear, achievable and truly yours',
              'Learning from people whose journeys genuinely inspire you',
              'Turning that vision into mindset, habits, attitude and routines',
            ],
          },
          {
            title: 'Building a Habit of Consistent Growth',
            range: 'Day 22–45',
            points: [
              'Practising the natural habit of showing up daily',
              'Building self-drive through passion & purpose',
              'Achieving natural momentum consistently to reflect growth',
            ],
          },
          {
            title: 'Life & Career Pathway Planning',
            range: 'Day 46–60',
            points: [
              'Final alignment of your mindsets with your purpose & vision',
              'Clarity on 5 areas of growth: Academics, Skills, Exposure, Personal & Social',
              'Expert guidance on a unique, future-ready life and career plan',
              'Building a 5-year roadmap on your personality, purpose, vision & career growth',
              'Resolving final queries for confidence development',
            ],
          },
        ],
      },
    ],
  },

  breakthrough: {
    subtitle: "Our Breakthrough Program is for students who want long-term mentoring to achieve complete transformation of their personality, life & career.",
    stages: [
      {
        title: 'Pre-session',
        range: 'Day 1 · 0–90 min',
        steps: [
          {
            points: [
              'Knowing your background, academics, and personal development so far',
              'Organising all details for the planned personalised mentoring program',
            ],
          },
        ],
      },
      {
        title: 'Mindset Building',
        range: 'Day 3–60',
        steps: [
          {
            title: 'Life & Background Study',
            range: 'Day 3',
            points: [
              'Knowing your journey so far — personal, professional & social',
              'Understanding mindsets, habits & choices that made you, you',
              'Deep self-reflection through questions, concepts & examples',
              'Mentoring on ideas to evolve naturally',
            ],
          },
          {
            title: 'Tailored Tasks for Self-Discovery',
            range: 'Day 4–20',
            points: [
              'Personalised tasks to uncover your hidden strengths and potential',
              'Exercises designed to build focus, balance, clarity & vision',
              'Weekly checks & support to keep you moving ahead',
            ],
          },
          {
            title: 'Develop a Winner’s Mindset',
            range: 'Day 21',
            points: [
              'Recognising your mindsets, patterns, and what sets you apart',
              'Aligning your vision with your evolving personality',
              'Helping you move forward with the right examples & routines',
              'Defining a purpose you can accomplish daily',
            ],
          },
          {
            title: 'Creating the Right Environment for Growth',
            range: 'Day 22–45',
            points: [
              'Building strong inner awareness to build the right outer conditions',
              'Surrounding you with the right sets of mindsets, ideologies & people',
              'Exploring patterns, emotions & habits holding you back',
            ],
          },
          {
            title: 'Infuse Your Personal Life with a Career Blueprint',
            range: 'Day 46–60',
            points: [
              'Reflecting changes in your attitude, thinking, and purpose',
              'Driving final clarity and alignment to your life and career goals',
              'Blueprint connecting your core to your future life and career needs',
              'Personalised 5-year mentoring plan to guide your journey ahead',
            ],
          },
        ],
      },
      {
        title: 'Application of Blueprint',
        range: 'Day 60–730',
        note: 'Personalised to each participant’s speed, comfort & availability.',
        steps: [
          {
            title: 'Encouraging You to Take Action',
            points: [
              'Opening your mind to attempting and exploring before implementing',
              'Driving purposeful actions through personalised mentoring',
              'Building quality in your core aspects through consistent mentoring',
            ],
          },
          {
            title: 'Empowering You to Embrace Results',
            points: [
              'Guiding you to be receptive of the results neutrally',
              'Using every lesson as positive fuel to grow resilience',
              'Moving to the next level of growth with confidence & belief',
              'Learning to face failure without giving up',
            ],
          },
          {
            title: 'Consistent Mentoring and Guidance',
            points: [
              'Regularly reviewing your progress through a personalised blueprint',
              'Anticipating potential obstacles and guiding you through them',
              'Continuous support to keep you focused and aligned on your vision',
              'Building resilience so deep it becomes your second nature',
            ],
          },
          {
            title: 'Self-Validation and Accountability',
            points: [
              'Learning to evaluate your own ideas and actions',
              'Creating checkpoints for self-awareness, reflection & growth',
              'Getting feedback through planned, purposeful check-ins',
              'Building a lifelong instinct to spot real problems and solve them',
            ],
          },
          {
            title: 'Guiding Your Progress',
            points: [
              'Working together to bring your blueprint to life',
              'Breaking your purpose & vision into focused daily tasks',
              'Building the knowledge and skills your goals actually need',
              'Seeking honest feedback without fear, and growing from it',
              'Building momentum layer by layer, until your best feels effortless',
            ],
          },
          {
            title: 'The First Solo Flight',
            points: [
              'Recognising the persistent efforts behind every victory, small or big',
              'Reaching your best form through practice and unshakeable belief',
              'Every lesson from this journey is now simply part of who you are',
              'Allowing your first solo flight to achieve your vision & dreams',
              'A safe, steady landing to build your future',
              'Building direction for turning bigger plans into reality',
            ],
          },
          {
            title: 'Parent Alignment & Guidance',
            range: 'Every 3–4 months',
            points: [
              'Understand the changes and growth happening within your child',
              'Align your expectations with their evolving goals and aspirations',
              'Create a home environment that supports their growth',
              'Know what to expect at different stages of their journey',
              'Learn how to support them without taking over their decisions',
              'Recognise, appreciate, and celebrate their progress along the way',
            ],
          },
        ],
      },
    ],
    closing:
      'At Svastrino, we don’t just build careers; we build the person behind them. Every session, every task, and every reflection is designed to sharpen a mind that thinks bigger, acts bolder, and lives with unshakeable purpose.',
  },
}

export const PROGRAM_HERO = {
  'bulls-eye': {
    title: "Bull's Eye Program",
    tagline: "Get a quick yet accurate solution for your Career Confusion. Trusted by 14k students over 17+ years."
  },
  'bloom': {
    title: "Bloom Program",
    tagline: "Cultivate a Visionary Mindset and Set Goals for a Bright Future. Trusted by 500+ students."
  },
  'breakthrough': {
    title: "Breakthrough Program",
    tagline: "Ace the art of self-discipline and evolve into an enterprising leader. Trusted by 290+ students."
  }
}

export const PROGRAM_BENEFITS = {
  'bulls-eye': [
    "Professional career clarity before deadlines",
    "Expert opinion on Streams, Courses, Colleges & Universities",
    "A step-by-step personalised global career plans, starting from Grade 8",
    "Resolve last-minute career confusion with expert advice",
    "Understand our ideologies and see the impact of long-term mentoring",
    "Experience full service from the comfort of your home"
  ],
  'bloom': [
    "Discover your mindsets, patterns, routines & habits ",
    "Explore things that make you, you",
    "Explore your gifted potentials & talents",
    "Create & Better your life & career vision ",
    "Explore exciting & rewarding global careers just for you",
    "Test options before you finalise your path",
    "Leave with a 5-year plan that matches you & your needs ",
  ],
  'breakthrough': [
    "Deep reflection & personalised mentoring for life & career growth ",
    "Build your personality & presence around your vision and purpose ",
    "Understand your patterns & solve meaningful personal or global problems ",
    "Explore career & life paths that align with your goals ",
    "Grow into the leader, entrepreneur, artist, innovator or athlete you aspire to be ",
    "Create a personalised 5-year plan to turn your dreams into reality",
  ]
}

/**
 * PROGRAM_JOURNEYS_2 — the client's supplied journey copy, kept next to
 * PROGRAM_JOURNEYS. The wording, timings, stage labels, spellings and typos are
 * reproduced VERBATIM (exactly as the client provided — do NOT "tidy" them).
 * Same stage → step → points shape as PROGRAM_JOURNEYS, where:
 *   range       — the parenthesised timing line, as written
 *   note        — the "Stage N: <phase>" sub-header (+ any bracketed caveat)
 *   step.title  — the step heading, with its "(Day …)" kept inline as supplied
 *   duration    — the "Total Program Duration" value
 *   inclusions  — the "Program Inclusions" lines, as an array
 * Not wired into any page yet: to use it, point ProgramJourney.jsx at
 * PROGRAM_JOURNEYS_2 (and render note/duration/inclusions) when ready.
 */
export const PROGRAM_JOURNEYS_2 = {
  'bulls-eye': {
    subtitle: "Our Bull's Eye Program provides a step-by-step process to understand your profile, explore your options, and finalise your career direction.",
    stages: [
      {
        title: 'Pre-Session - Stage 1',
        range: '(0 to 90 Minutes on Day 1)',
        steps: [
          {
            points: [
              "Analysis of your background, academics, and personal development so far",
              "Organising your details for a productive counselling session",
            ],
          },
        ],
      },
      {
        title: 'Actual Session - Stage 2',
        range: '(91 to 240 minutes on Day 3)',
        steps: [
          {
            title: "Getting to know you",
            points: [
              "Identifying personality, strengths, background, and career interests",
              "Recognising your unique potential, natural talents & abilities",
            ],
          },
          {
            title: "Addressing Your Core Needs",
            points: [
              "Personalised career guidance for your specific concerns and needs",
              "Understanding your vision, goals, and aspirations",
            ],
          },
          {
            title: "Streamlining Your Goals",
            points: [
              "Clarifying and prioritizing your ideas and ambitions",
              "Building a long-term vision for career success",
            ],
          },
          {
            title: "Guiding Your Ideal Career Match",
            points: [
              "Recommending careers that align with your personality and vision",
              "Exploring futuristic and high-growth career options",
              "Creating a personalised career plan just for you",
              "Solving all your career confusion",
            ],
          },
        ],
      },
      {
        title: 'Post-Session - Stage 3',
        range: '(241 to 300 minutes on Day 10)',
        steps: [
          {
            points: [
              "Follow-up session one week after your career session",
              "Finalising your career choice and clearing new doubts",
              "Expert guidance to confidently pursue your career path",
            ],
          },
        ],
      },
    ],
    duration: "~ 10 Days",
    inclusions: [
      "Pre-session 90 minutes +",
      "2 sessions of ~ 2.5 hours each",
      "And, Follow-ups in between sessions",
    ],
  },

  bloom: {
    subtitle: "The Bloom journey helps you understand yourself, build your vision and create a clear path forward",
    stages: [
      {
        title: 'Pre-Session - Stage 1',
        range: '(0 to 90 Minutes on Day 1)',
        steps: [
          {
            points: [
              "Analysis of your background, academics, and personal development so far",
              "Organising all details for the planned personalised mentoring program",
            ],
          },
        ],
      },
      {
        title: 'Actual Sessions - Stage 2',
        range: '(91 to 540 minutes From Day 3 to Day 60)',
        steps: [
          {
            title: "Complete Personality Analysis (Day 3)",
            points: [
              "Understanding your personal, academic, emotional, and social growth",
              "Exploring the mindsets, patterns, habits, and choices that shaped you",
              "Deep self-reflection through personal questions & exercises",
              "Guidance on ways to evolve naturally",
            ],
          },
          {
            title: "Tailored Tasks for Self-Discovery (Day 4 to 20)",
            points: [
              "Tasks designed to uncover your hidden strengths",
              "Sharpening focus and restoring inner balance",
              "Reconnecting with your true self with confidence",
              "Regular check-ins to track your progress",
            ],
          },
          {
            title: "Developing Your Vision & Winning Attitude (Day 21)",
            points: [
              "Recognising you, your personality & your uniqueness",
              "Building together a vision that's clear, achievable and truly yours",
              "Learning from people whose journeys genuinely inspire you",
              "Turning that vision into mindset, habits, attitude and routines",
            ],
          },
          {
            title: "Building a Habit of Consistent Growth (Day 22 to 45)",
            points: [
              "Practising the natural habit of showing up daily",
              "Building self-drive through passion & purpose",
              "Achieving natural momentum consistently to reflect growth",
            ],
          },
          {
            title: "Life & Career Pathway Planning (Day 46-60)",
            points: [
              "Final alignment of your mindsets with your purpose & visions",
              "Clarity on 5 areas of growth: academics, skills, exposure, personal & social",
              "Expert guidance on a unique, future-ready life and career plan",
              "Building a 5-year roadmap on your personality, purpose, vision & career growth",
              "Resolving final queries for confidence development",
            ],
          },
        ],
      },
    ],
    duration: "45- 60 Days",
    inclusions: [
      "Pre-session 90 minutes +",
      "3 sessions of ~2.5 hours each",
      "+ Weekly follow-ups & support throughout the program",
    ],
  },

  breakthrough: {
    subtitle: "Our Breakthrough Program is for students who want long-term mentoring to achieve complete transformation of their personality, life & career.",
    stages: [
      {
        title: 'Pre-Session - Stage 1',
        range: '(0 to 90 Minutes on Day 1)',
        steps: [
          {
            points: [
              "Undersanding your background, academics, and personal development so far",
              "Organising all the details for the planned personalised mentoring program",
            ],
          },
        ],
      },
      {
        title: 'Actual Sessions - Stage 2',
        range: '(91 to 540 minutes From Day 3 to Day 60)',
        note: 'Stage 1: Mindset Building (0 to 60 Days)',
        steps: [
          {
            title: "Life & Background Study (Day 3)",
            points: [
              "Understanding your journey so far, personal, professional & social",
              "Understanding mindsets, habits, & choices that made you, you",
              "Deep self-reflection through questions, concepts & examples",
              "Mentoring on ideas to evolve naturally",
            ],
          },
          {
            title: "Tailored Tasks for Self-Discovery (Day 4 to 20)",
            points: [
              "Personalised tasks to uncover your hidden strengths and potential",
              "Exercises designed to build focus, balance, clarity & vision",
              "Weekly check-ins & support to keep you moving ahead",
            ],
          },
          {
            title: "Develop a Winner's Mindset (Day 21)",
            points: [
              "Recognising your mindsets, patterns, and what sets you apart",
              "Aligning your vision with your evolving personality",
              "Helping you move forward with the right examples & routines",
              "Defining a purpose you can accomplish daily",
            ],
          },
          {
            title: "Creating the Right Environment for Growth (Day 22 to 45)",
            points: [
              "Building strong inner awareness to build the right outer conditions",
              "Surrounding you with the right sets of mindsets, ideologies & people",
              "Exploring patterns, emotions & habits holding you back",
            ],
          },
          {
            title: "Infuse Your Personal Life with Career Blueprint (Day 46 to 60)",
            points: [
              "Reflecting changes in your attitude, thinking, and purpose",
              "Driving final clarity and alignment to your life and career goals",
              "Blueprint connecting your core to your future life and career needs",
              "Personalized 5-year mentoring plan to guide your journey ahead",
            ],
          },
        ],
      },
      {
        title: 'Actual Sessions - Stage 3',
        range: '(541 to 1800 minutes From Day 60 to Day 730)',
        note: 'Stage 2: Application of Blueprint (60 to 730 days)\n[The following development are personalised as per participant speed, comfort & availability]',
        steps: [
          {
            title: "Encouraging You to Take Action",
            points: [
              "Opening your mind to trying and exploring before implementing",
              "Driving purposeful actions through Personalised mentoring",
              "Building quality in your core aspects through consistent mentoring",
            ],
          },
          {
            title: "Empowering You to Embrace Results",
            points: [
              "Guiding you to be receptive of the results neutrally",
              "Using every lesson as positive fuel to grow resilience",
              "Moving to the next level of growth with confidence & belief",
              "Learning to face failure without giving up",
            ],
          },
          {
            title: "Consistent Mentoring and Guidance",
            points: [
              "Regularly reviewing your progress through a personalised blueprint",
              "Anticipating potential obstacles and guiding you through them",
              "Continuous support to keep you focused and aligned on your vision",
              "Building resilience so deep it becomes second nature",
            ],
          },
          {
            title: "Self-Validation and Accountability",
            points: [
              "Learn to evaluate your own ideas and actions",
              "Creating checkpoints for self-awareness, reflection & growth",
              "Getting feedback through planned, purposeful check-ins",
              "Building a lifelong instinct to spot real problems and solve them",
            ],
          },
          {
            title: "Guiding Your Progress",
            points: [
              "Working together to bring your blueprint to life",
              "Breaking your purpose & vision into focused daily tasks",
              "Building the knowledge and skills your goals actually need",
              "Seeking honest feedback without fear, and growing from it",
              "Building momentum layer by layer, until your best feels effortless",
            ],
          },
          {
            title: "The First Solo Flight",
            points: [
              "Recognising persistent efforts behind every victory, small or big",
              "Reaching your best form, through practice and unshakable belief",
              "Every lesson from this journey is simply now part of who you are",
              "Allowing your first solo flight to achieve your vision & dreams",
              "A safe, steady landing to build your future",
              "Building direction for turning bigger plans into reality",
            ],
          },
          {
            title: "Parent Alignment & Guidance (Every 3-4 Months)",
            points: [
              "Understand the changes and growth happening within your child",
              "Align your expectations with their evolving goals and aspirations",
              "Create a home environment that supports their growth",
              "Know what to expect at different stages of their journey",
              "Learn how to support them without taking over their decisions",
              "Recognise, appreciate, and celebrate their progress along the way",
            ],
          },
        ],
      },
    ],
    closing:
      "At Svastrino, we don't just build careers; we build the person behind them. Every session, every task, and every reflection is designed to sharpen a mind that thinks bigger, acts bolder, and lives with unshakable purpose.",
    duration: "2 Years with atleast 2,200 minutes",
    inclusions: [
      "Pre-session 90 minutes +",
      "10 Sessions of 2 Hours each",
      "Or",
      "20 Sessions of 1 Hour each (Depending on students' speed, availability, and comfort)",
      "Spread over 2 years + regular follow-ups and support in between sessions",
    ],
  },
}

export const ALL_PROGRAMS = [
  {
    "slug": "bulls-eye",
    "name": "Bull's Eye Program",
    "tagline": "Get a quick yet accurate solution for your 'Career Confusion'",
    "trustLine": "",
    "summary": "A focused 2-hour session designed to achieve clarity when you are stuck between options or facing a deadline — ending with concrete career recommendations and a plan.",
    "duration": "10 days",
    // "sessions": "3 sessions of 2 hours each — about 6 hours in total, plus the pre-work and the follow-up",
    "sessions": "Pre-session 90 minutes + 2 sessions of ~ 2.5 hours each &, Follow-ups in between sessions",
    "mode": "Online",
    "category": {
      "slug": "career-counselling",
      "name": "Career Counselling"
    },
    "bookingSku": "mentoring-bullseye",
    "buyMode": "self-serve"
  },
  {
    "slug": "bloom",
    "name": "Bloom Program",
    "tagline": "Cultivate a visionary mindset and set goals for a bright future",
    "trustLine": "",
    "summary": "Svastrino's personality-based mentoring program. Over 45–60 days it moves from a full personality analysis through self-discovery tasks and vision building, ending in a personalised 5-year career plan.",
    "duration": "45 - 60 days",
    // "sessions": "5 sessions of 2 hours each plus weekly follow-ups — about 10 hours in total",
    "sessions": "Pre-session 90 minutes + 3 sessions of ~2.5 hours each + Weekly follow-ups & support throughout the program",
    "mode": "Online",
    "category": {
      "slug": "personalised-mentoring",
      "name": "Personalised Mentoring"
    },
    "bookingSku": "mentoring-bloom",
    "buyMode": "self-serve"
  },
  {
    "slug": "breakthrough",
    "name": "Breakthrough Program",
    "tagline": "Ace the art of self-discipline and evolve into an 'Enterprising Leader'",
    "trustLine": "",
    "summary": "A two-year personalised mentoring program to craft future leaders and entrepreneurs — building mindset first, then attitude, with consistent mentoring and accountability across academics, professional skills, experience, extracurriculars and social work.",
    // "duration": "2 years",
    "duration": "2 Years with atleast 2,200 minutes",
    "sessions": "Pre-session 90 minutes + 10 Sessions of 2 Hours each Or 20 Sessions of 1 Hour each (Depending on students’ speed, availability, and comfort) Spread over 2 years + regular follow-ups and support in between sessions",
    "mode": "Online",
    "category": {
      "slug": "personalised-mentoring",
      "name": "Personalised Mentoring"
    },
    "bookingSku": "mentoring-breakthrough",
    "buyMode": "expert-call"
  }
]