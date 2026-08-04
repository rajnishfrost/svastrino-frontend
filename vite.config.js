import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Offline support: precaches the app shell so the site opens without a
    // network, and ships our own service worker (src/sw.js) which serves
    // downloaded videos + the last course payload from cache when offline.
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: null, // registered manually in main.jsx
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // Classic (non-module) worker — our SW has no imports, and Firefox
        // still doesn't support module service workers.
        rollupFormat: 'iife',
      },
      manifest: {
        name: 'Svastrino',
        short_name: 'Svastrino',
        description: 'Career mentoring & Skill Build — learn online, even offline.',
        theme_color: '#3f7932',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: '/favicon.png', sizes: '192x192', type: 'image/png' },
        ],
      },
      // Never run the SW in `vite dev` — it would cache dev modules and serve a
      // stale app. Test offline against a production build (`build` + `preview`).
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5174,
    proxy: {
      // Forward API calls to the Svastrino Express backend during development
      '/api': {
        target: 'http://localhost:5060',
        changeOrigin: true,
      },
      // Uploaded media (admin video uploads) — proxied so the browser streams
      // them via 5174 (Chrome blocks the API's port 5060 directly).
      '/uploads': {
        target: 'http://localhost:5060',
        changeOrigin: true,
      },
    },
  },
  // `vite preview` (the production build where the service worker actually runs,
  // so it's the ONLY place to test offline) does NOT reuse `server.proxy` — it
  // needs its own. Same targets so the built app can reach the backend + media.
  preview: {
    port: 4173,
    proxy: {
      '/api': { target: 'http://localhost:5060', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5060', changeOrigin: true },
    },
  },
})
