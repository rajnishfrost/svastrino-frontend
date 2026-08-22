import { Link } from 'react-router-dom'
import './PaymentFailed.css'

/**
 * Shown when a payment does not go through — a declined card, a dropped UPI
 * request, a closed window. It is deliberately its own screen rather than a red
 * line above the form: someone who has just failed to pay needs to be told
 * plainly that no money was taken, and be given one obvious way to try again.
 *
 * `reason` is whatever the gateway said. It is shown as a secondary line
 * because gateway wording is often blunt ("BAD_REQUEST_ERROR") and should never
 * be the first thing a customer reads.
 */
export default function PaymentFailed({ reason = '', amount = '', item = '', onRetry, backTo, backLabel }) {
  return (
    <div className="card pay-failed">
      <div className="pay-failed-mark" aria-hidden>!</div>

      <h2 className="pay-failed-title">Your payment did not go through</h2>

      <p className="pay-failed-lead">
        Nothing has been charged. If your bank has put a hold on the amount it
        will be released on its own, usually within a few working days.
      </p>

      {(item || amount) && (
        <p className="pay-failed-what">
          {item}{item && amount ? ' · ' : ''}{amount}
        </p>
      )}

      {reason && (
        <p className="pay-failed-reason">
          <span>What the bank said:</span> {reason}
        </p>
      )}

      <div className="pay-failed-acts">
        {onRetry && (
          <button type="button" className="btn btn-primary btn-large" onClick={onRetry}>
            Try the payment again
          </button>
        )}
        {backTo && (
          <Link to={backTo} className="btn btn-secondary btn-large">{backLabel || 'Go back'}</Link>
        )}
      </div>

      <p className="pay-failed-help">
        Tried more than once and it still will not go through?{' '}
        <Link to="/support/new">Tell us what happened</Link> and we will sort it
        out with you — you can also pay by a link we send you directly.
      </p>
    </div>
  )
}
