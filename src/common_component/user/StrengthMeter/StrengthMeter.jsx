import { scorePassword, STRENGTH_LABEL } from '../../../utils/password.js'
import './StrengthMeter.css'

/**
 * Password strength bar + label. Self-contained: pass the raw password (and the
 * user's name, so name-based passwords read as "Weak"). Used identically by
 * Signup, Reset password and the Settings password form.
 */
export default function StrengthMeter({ pw = '', name = '' }) {
  const score = scorePassword(pw, name)
  const percent = pw.length === 0 ? 0 : ((score + 1) / 5) * 100
  const label = pw.length === 0 ? '' : STRENGTH_LABEL[score]
  const cls = ['none', 'weak', 'weak', 'fair', 'good', 'strong'][score + (pw ? 1 : 0)] || 'none'

  return (
    <div className="pw-strength" aria-live="polite">
      <div className="pw-strength-track">
        <div className={`pw-strength-bar pw-strength-bar--${cls}`} style={{ width: `${percent}%` }} />
      </div>
      <span className={`pw-strength-label pw-strength-label--${cls}`}>{label}</span>
    </div>
  )
}
