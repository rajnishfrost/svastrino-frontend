/** @type {import('tailwindcss').Config} */
export default {
  // NOTE: Preflight (Tailwind's global reset) and the `container` core plugin
  // are DISABLED. The rest of the site (Dashboard, Learn, Admin, etc.) is styled
  // by the vanilla-CSS design-token system in src/styles/*.css. Turning off
  // Preflight keeps Tailwind from resetting those pages, and turning off the
  // container plugin lets us keep using the existing `.container` class from
  // global.css (same 1200px/24px behaviour proto's container had). Tailwind here
  // only provides opt-in utility classes used by the new Home page + chrome.
  corePlugins: {
    preflight: false,
    container: false,
  },
  // Scoped to ONLY the files rebuilt with Tailwind (Home page + Footer). This
  // keeps Tailwind from generating a utility whose name happens to collide with
  // a class used on an existing vanilla-CSS page. Add paths here when a new page
  // adopts Tailwind.
  content: [
    './src/pages/user/homepage/**/*.jsx',
    './src/pages/user/contactpage/**/*.jsx',
    './src/pages/user/aboutpage/**/*.jsx',
    './src/pages/user/ideologypage/**/*.jsx',
    './src/pages/user/servicespage/**/*.jsx',
    './src/pages/user/resourcespage/**/*.jsx',
    './src/pages/user/careerlibrarypage/**/*.jsx',
    './src/pages/user/blogpage/**/*.jsx',
    './src/pages/user/psychometricpage/**/*.jsx',
    './src/pages/user/nirmaanpage/**/*.jsx',
    './src/pages/user/bookonlinepage/**/*.jsx',
    './src/pages/user/dashboardpage/**/*.jsx',
    './src/pages/user/downloadspage/**/*.jsx',
    './src/common_component/user/Pagination/Pagination.jsx',
    './src/common_component/user/EnquiryFields/EnquiryFields.jsx',
    './src/common_component/user/RichText/RichText.jsx',
    './src/common_component/user/SearchSuggest/SearchSuggest.jsx',
    './src/common_component/user/Footer/Footer.jsx',
    './src/common_component/user/FaqAccordion/FaqAccordion.jsx',
    './src/common_component/user/FaqAccordion/FaqSection.jsx',
    './src/common_component/user/Testimonials/Testimonials.jsx',
  ],
  theme: {
    // One desktop cut-off for the whole site: from 900px wide (a 9-10" tablet
    // in landscape and up) pages use their desktop layout. Plain-CSS files use
    // the same line - max-width: 899px for the phone/tablet layout.
    screens: {
      sm: '640px',
      md: '768px',
      lg: '900px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // --- Svastrino brand palette (mirrors svastrino-proto) ---
        brand: {
          navy: '#0f2c5c',
          'navy-dark': '#0a1f43',
          crimson: '#c8102e',
          'crimson-dark': '#a30c25',
          rose: '#fdeef1',
          blue: '#2f7ae5',
          'blue-dark': '#1c5fc4',
          'blue-light': '#eaf2fd',
          cream: '#f6f9fc',
          slate: '#64748b',
        },
        // --- Nirmaan sub-brand palette (green + brown on cream) ---
        nirmaan: {
          brown: '#3b2822',
          'brown-soft': '#5a3f33',
          green: '#3f7932',
          'green-dark': '#2d5723',
          'green-light': '#5a9a4d',
          olive: '#90743c',
          'olive-light': '#b09462',
          // Deep enough that white cards stand out on it (was #faf6ec, ~2% off white).
          // A little deeper than the original #faf6ec (~2% off white), so white
          // cards stand out on it while it still reads as a light cream.
          cream: '#f5eedc',
          'cream-dark': '#eadfc3',
          sand: '#e5e0d4',
          'gray-500': '#786c5b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        // Tailwind's own `pulse` fades to .5 opacity, which takes a light
        // placeholder block all the way to white — half of every cycle the
        // skeleton is invisible. This one only dims.
        skeleton: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.72' },
        },
        // Placeholders stay invisible for the first 200ms, then fade in, so a
        // response that lands quickly never flashes a skeleton (same rule as
        // common_component/Skeleton).
        'skeleton-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        marquee: 'marquee 32s linear infinite',
        skeleton: 'skeleton-in 0.25s ease-out 0.2s both, skeleton 1.6s ease-in-out 0.45s infinite',
      },
    },
  },
  plugins: [],
}
