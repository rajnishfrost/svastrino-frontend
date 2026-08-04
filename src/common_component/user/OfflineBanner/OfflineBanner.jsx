import { useEffect, useState } from 'react'
import './OfflineBanner.css'

/**
 * Thin site-wide bar that appears whenever the browser loses connectivity, so
 * the offline state is obvious even on pages that were already loaded. Purely
 * driven by the browser's online/offline events.
 */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' && navigator.onLine === false
  )

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="offline-banner" role="status">
      <span className="offline-dot" aria-hidden="true" />
      You're offline — some content may be unavailable until you reconnect.
    </div>
  )
}
