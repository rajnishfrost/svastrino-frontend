/**
 * The metadata svastrino.com already ranks with.
 *
 * Every title and description here was read off the live WordPress page it
 * replaces, not rewritten. That is deliberate: search engines have matched
 * these pages to these words for years, and a migration is the wrong moment to
 * change what a result says. New wording can be tried later, once the move has
 * settled and any change can be measured on its own.
 *
 * Keyed by the NEW path. Pages whose address did not change are keyed by it too.
 */
export const LEGACY_SEO = {
  '/': {
    title: "Personalized Career Mentoring Program, Online Career Counseling",
    description: "If you are looking for online career counseling and career mentoring program, then we svastrino is here to help you to provide career guidance.",
  },
  '/about': {
    title: "How is Svastrino Carved as the Best Online Career Mentoring",
    description: "Svastrino is best career counseling service provider who provide service to choose right career path for students.",
  },
  '/blog': {
    title: "Blogs - Svastrino",
    description: "",
  },
  '/book-online': {
    title: "Book your Online Career Mentoring & Guidance Session with Svastrino",
    description: "Book Your Spot in Svastrino's Online Programs: Model Session, Bull's Eye Program, Bloom Program, Breakthrough Program. Discover Your Potential Now!",
  },
  '/contact': {
    title: "Connect with Svastrino- Best Online Career Guidance Provider",
    description: "Reach out and connect with Svastrino career counseling, your gateway to personalized career guidance and support.",
  },
  '/our-ideology': {
    title: "Svastrino Approach Career Mentoring, Online Career Counseling",
    description: "Svastrino understand the core issues those are coming infront of career planning and how to deal with them and providing planned results.",
  },
  '/resources/career-library': {
    title: "Details on Futuristic Careers and Courses by Svastrino",
    description: "Discover Striking & Most Unique Career information with Svastrino's Course List: Explore Futuristic Careers & Courses for Ultimate Success",
  },
  '/resources/faqs': {
    title: "Frequently Asked Questions About Svastrino’s Career Mentoring",
    description: "Get Answers to Your Concerns on Svastrino's working. Find Details on how Svastrino is committed to help you Identify your Career Needs & to Resolve all your Career Concerns.",
  },
  '/resources/success-stories': {
    title: "Read The Success Stories of Our Online Guidance for Career Counseling",
    description: "Experience the Transformative Power of Svastrino's Services: Explore Inspiring Success Stories and Discover the Future of personalized Career Guidance.",
  },
  '/services': {
    title: "Online Career Guidance Programs: Bulls Eye, Bloom, Breakthrough Programs",
    description: "Svastrino’s Bulls Eye, Bloom, & Breakthrough programs are meticulously designed to provide tailored support to empower individuals to navigate their career paths.",
  },
  '/services/bloom': {
    title: "Transform your Career through Svastrino's Personality Based Mentoring Program",
    description: "Cultivate a Visionary Mindset and Set Goals for a Bright Future with Svastrino's Bloom Program. Experience Personalized Career Mentoring to Explore Your Potential",
  },
  '/services/breakthrough': {
    title: "Personalised Career Mentoring Program to craft Future Leaders & Entrepreneurs",
    description: "Elevate Your Potential with Svastrino's Breakthrough Program: Master Self-Discipline and Evolve as a Leader through Crafting Right Mindset.",
  },
  '/services/bulls-eye': {
    title: "2 Hours Session Planned to Achieve Clarity in Career Confusion",
    description: "Get Professional Solutions to Last Moment Career Confusion through the Iconic Bull's Eye Program Tailored to Guide Immediate Resolution in 2 Hours",
  },
  '/services/compare': {
    title: "Compare Our Career Counseling Programs Bull's Eye, Bloom, Breakthrough Program",
    description: "Compare to know the Benefits of our carefully crafted Career Mentoring and Counseling Programs tailor to fit your needs",
  }
}

/** Metadata for a fixed page, or undefined if it has none recorded. */
export const seoFor = (path) => LEGACY_SEO[path]
