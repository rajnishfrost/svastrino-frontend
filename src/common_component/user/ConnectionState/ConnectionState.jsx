import { useEffect } from 'react'
import { isNetworkError } from '../../../api/client.js'
import './ConnectionState.css'

/**
 * Friendly empty-state for a failed data load. Distinguishes a connectivity
 * problem ("You're offline") from a genuine server error, shows a matching
 * icon + message, and offers a Retry button. When offline, it also auto-retries
 * the moment the browser reconnects (the `online` event).
 *
 * @param {Error}    error    the caught error (used to classify offline vs server)
 * @param {Function} onRetry  called to re-run the fetch
 * @param {string}   label    what failed to load, e.g. "posts" (for the server-error copy)
 */
export default function ConnectionState({ error, onRetry, label = 'this content' }) {
  const offline = isNetworkError(error)

  // Reconnected? Retry automatically so the user doesn't have to.
  useEffect(() => {
    if (!offline || !onRetry) return
    const onOnline = () => onRetry()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [offline, onRetry])

  return (
    <div className="connection-state" role="alert">
      <div className={`connection-icon${offline ? ' is-offline' : ' is-error'}`}>
        {offline ? <WifiOffIcon /> : <AlertIcon />}
      </div>

      <h3 className="connection-title">
        {offline ? "You're offline" : 'Something went wrong'}
      </h3>

      <p className="connection-message">
        {offline
          ? "We can't reach the internet right now. Check your connection — we'll retry as soon as you're back online."
          : `We couldn't load ${label}. This is usually temporary.`}
      </p>

      {onRetry && (
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

function WifiOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 1l22 22" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}
