import { useEffect, useState } from 'react'

/**
 * In-app confirm dialog for the admin panel (replaces window.confirm/prompt).
 * Reuses the shared .adm-modal styles. Pass `input` to collect a short reason;
 * `onConfirm` receives its value. Esc / overlay click / Cancel all dismiss.
 */
export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  input, // { label, placeholder, required } | undefined
  busy = false,
  onConfirm,
  onCancel,
}) {
  const [value, setValue] = useState('')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="adm-modal-overlay" onClick={() => !busy && onCancel?.()}>
      <div className="adm-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2 className="adm-modal-title">{title}</h2>
        {message && <p className="adm-sub" style={{ marginTop: 4 }}>{message}</p>}

        {input && (
          <div className="adm-field" style={{ marginTop: 14 }}>
            {input.label && <label>{input.label}</label>}
            <input
              className="adm-input"
              autoFocus
              value={value}
              placeholder={input.placeholder || ''}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !(input.required && !value.trim())) onConfirm?.(value) }}
            />
          </div>
        )}

        <div className="adm-modal-actions">
          <button className="adm-btn adm-btn--ghost" onClick={() => onCancel?.()} disabled={busy}>{cancelLabel}</button>
          <button
            className="adm-btn"
            style={danger ? { background: '#b3261e', borderColor: '#b3261e' } : undefined}
            disabled={busy || (input?.required && !value.trim())}
            onClick={() => onConfirm?.(value)}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
