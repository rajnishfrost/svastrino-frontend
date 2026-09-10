/**
 * The free week, offered the moment a student finishes signing up — whether
 * that was clicking the emailed verification link or coming in through Google.
 *
 * Shown once they are already signed in, so there is nothing left to fill in:
 * one button starts the trial and drops them in the course. It is the first
 * thing the account says to them, and it is said once. `lead` names how they
 * got here; everything after it is the same offer either way.
 */
export default function TrialWelcome({
  busy, error, onTakeIt, onSkip,
  lead = 'Your email is verified and you are signed in.',
}) {
  return (
    <div className="trial-modal" role="dialog" aria-modal="true" aria-labelledby="trial-modal-title">
      <div className="trial-modal-card">
        <div className="trial-modal-mark">
          <img src="/nirmaan-tree.png" alt="" aria-hidden />
        </div>

        <span className="trial-modal-ribbon">Free · 1-week trial</span>

        <h2 id="trial-modal-title">Your first week is on us</h2>
        <p className="trial-modal-sub">
          {lead} Start <strong>Nirmaan</strong> free for a week — the introduction and all of
          Week 1, exactly as a paying student gets them.
        </p>

        <ul className="trial-modal-points">
          <li>Real videos and real daily tasks</li>
          <li>Everything you write is saved</li>
          <li>No payment, and no card asked for</li>
        </ul>

        {error && <p className="login-error" role="alert">{error}</p>}

        <button type="button" className="btn btn-primary trial-modal-go" onClick={onTakeIt} disabled={busy}>
          {busy ? 'Starting…' : 'Start my free week'}
        </button>
        <button type="button" className="trial-modal-skip" onClick={onSkip} disabled={busy}>
          Maybe later — go to my dashboard
        </button>
      </div>
    </div>
  )
}
