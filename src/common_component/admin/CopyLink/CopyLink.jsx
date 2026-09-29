import { useState } from 'react'

/**
 * A link shown in full, with a Copy button — for an institution's payment
 * link, wherever the admin meets it (after creating the institution, on its
 * order, on the institution itself). Clicking the box selects it, so it can be
 * copied by hand where the clipboard is blocked.
 */
export default function CopyLink({ url, compact = false }) {
  const [copied, setCopied] = useState(false)
  if (!url) return null
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* select the box and copy by hand */ }
  }
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: compact ? 'nowrap' : 'wrap', marginTop: compact ? 4 : 8 }}>
      <input className="adm-input" readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Payment link"
             style={compact ? { minWidth: 160, maxWidth: 220, fontSize: 12, padding: '4px 8px', height: 'auto' } : { flex: 1, minWidth: 240 }} />
      <button type="button" className="adm-btn adm-btn--sm" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
      {!compact && (
        <a className="adm-btn adm-btn--sm adm-btn--ghost" href={url} target="_blank" rel="noopener noreferrer">Open</a>
      )}
    </div>
  )
}
