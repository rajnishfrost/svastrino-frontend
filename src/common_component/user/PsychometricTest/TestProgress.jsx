/**
 * How far through the test the student is, as the test site last told us.
 * Shown on the card above "Continue your test" and in the guide pop-up.
 */
export default function TestProgress({ percent }) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)))
  return (
    <div className="ptest-progress">
      <div className="ptest-progress-head">
        <span>Your test progress</span>
        <strong>{pct}% complete</strong>
      </div>
      <div
        className="ptest-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Psychometric test progress"
      >
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
