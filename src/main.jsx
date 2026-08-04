import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { startOutboxSync } from './utils/outbox.js'
import './styles/global.css'
import './styles/nirmaan.css' // scoped under .theme-nirmaan (applied only on the Nirmaan page)

if (import.meta.env.DEV) {
  // A service worker must never run in dev — it can serve a stale bundle and
  // make the app look "not updated". Clean up any SW left from an earlier run.
  navigator.serviceWorker?.getRegistrations?.().then((rs) => rs.forEach((r) => r.unregister()))
  caches?.keys?.().then((keys) => keys.forEach((k) => caches.delete(k)))
} else {
  // Production: precache the app shell and serve downloaded videos offline.
  registerSW({ immediate: true })
}

// Replay anything queued while the student was offline (and again on reconnect).
startOutboxSync()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
