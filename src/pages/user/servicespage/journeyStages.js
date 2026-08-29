/**
 * Program journeys, clubbed by STAGE. Sourced from each programme's content
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
