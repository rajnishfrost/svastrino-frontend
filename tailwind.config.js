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
    './src/common_component/user/Footer/Footer.jsx',
  ],
  theme: {
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
          cream: '#faf6ec',
          'cream-dark': '#f1ead5',
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
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        marquee: 'marquee 32s linear infinite',
      },
    },
  },
  plugins: [],
}
