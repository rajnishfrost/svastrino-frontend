import { useState } from 'react'
import './PasswordField.css'

/**
 * A password box with an eye button to show or hide what was typed. A drop-in
 * for `<input type="password">`: every prop goes to the input (className,
 * value, onChange, autoComplete…), so each page keeps its own input styling.
 * The eye sits inside the right edge of the box.
 *
 * The login and reset-password pages have their own version, which also keeps
 * two boxes in step; this one is for single boxes everywhere else.
 */
export default function PasswordField({ wrapClassName = '', ...inputProps }) {
  const [show, setShow] = useState(false)
  return (
    <span className={`pwfield ${wrapClassName}`.trim()}>
      <input {...inputProps} type={show ? 'text' : 'password'} />
      <button
        type="button"
        className="pwfield-toggle"
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        title={show ? 'Hide password' : 'Show password'}
        onClick={() => setShow((v) => !v)}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </span>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.55 20.55 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a20.44 20.44 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
