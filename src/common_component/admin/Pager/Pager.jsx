/**
 * Page control for the paginated admin tables (blog posts, course pages, news).
 * With a single page there's nothing to click, so it collapses to just the
 * total — which is still worth showing.
 */
export default function Pager({ page, pages, total, onChange, unit = 'item' }) {
  const label = `${total} ${unit}${total === 1 ? '' : 's'}`

  if (pages <= 1) return <p className="adm-sub" style={{ marginTop: 10 }}>{label}</p>

  return (
    <div className="adm-pager">
      <button className="adm-btn adm-btn--ghost adm-btn--sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Prev
      </button>
      <span className="adm-sub" style={{ margin: 0 }}>Page {page} of {pages} · {label}</span>
      <button className="adm-btn adm-btn--ghost adm-btn--sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next →
      </button>
    </div>
  )
}
