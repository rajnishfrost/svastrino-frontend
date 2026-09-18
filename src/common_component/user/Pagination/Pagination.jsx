import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * Elliptical (ellipsis) pagination — numbered page pills that collapse to a "…"
 * whenever there are more pages than fit, with chevron Previous/Next controls.
 * Shared by the Blog and Career Library lists, which both drive it from the same
 * { page, pages } shape and a goToPage-style callback.
 *
 * `siblings` is how many pages to show on each side of the current one; page 1
 * and the last page are always shown, and a "…" fills any gap between.
 *
 * Pass `hrefFor(n)` and the controls become real links. That is not a detail: a
 * crawler follows an <a href> and does not click a button, so while these were
 * buttons the blog had one page as far as Google was concerned, and 207 of the
 * 219 articles had no link pointing at them from anywhere on the site. The
 * admin lists have no addresses of their own and keep the buttons, which is why
 * this is a prop rather than a rewrite.
 *
 * NOTE: outlines use `ring-*`, not `border-*`. Tailwind's preflight is disabled
 * in this project, so `border` renders no line (see src/styles/tailwind.css).
 */
const range = (start, end) => Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i)

// → [1, 'dots-l', 4, 5, 6, 'dots-r', 20]  (numbers to render, strings = ellipses)
function buildPages(current, total, siblings) {
  const slots = siblings * 2 + 5 // first + last + current + 2·siblings + 2 dots
  if (total <= slots) return range(1, total)

  const left = Math.max(current - siblings, 1)
  const right = Math.min(current + siblings, total)
  const leftDots = left > 2
  const rightDots = right < total - 1

  if (!leftDots && rightDots) return [...range(1, siblings * 2 + 3), 'dots-r', total]
  if (leftDots && !rightDots) return [1, 'dots-l', ...range(total - (siblings * 2 + 2), total)]
  return [1, 'dots-l', ...range(left, right), 'dots-r', total]
}

const CELL =
  'inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-full px-3.5 text-sm font-semibold transition-colors'
const IDLE =
  'cursor-pointer bg-white text-brand-navy ring-1 ring-brand-navy/15 hover:text-brand-crimson hover:ring-brand-crimson/40'
const NAV =
  'inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-brand-navy ring-1 ring-brand-navy/15 transition-colors hover:text-brand-crimson hover:ring-brand-crimson/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-brand-navy disabled:hover:ring-brand-navy/15'

export default function Pagination({ page, pages, onChange, hrefFor, ariaLabel = 'Pagination', siblings = 1 }) {
  if (!pages || pages <= 1) return null
  const items = buildPages(page, pages, siblings)

  // One numbered pill. A link when there is an address to link to, otherwise
  // the button this has always been.
  const cell = (n) => {
    const className = `${CELL} ${n === page ? 'bg-brand-crimson text-white shadow-sm shadow-brand-crimson/25' : IDLE} border-none`
    const ariaCurrent = n === page ? 'page' : undefined
    return hrefFor ? (
      <Link to={hrefFor(n)} className={className} aria-current={ariaCurrent}>{n}</Link>
    ) : (
      <button type="button" className={className} aria-current={ariaCurrent} onClick={() => onChange(n)}>{n}</button>
    )
  }

  // Previous/Next. A disabled link is not a thing, so at either end these
  // render as a span wearing the same disabled styling the button had.
  const nav = (n, disabled, label, icon) => {
    if (disabled) {
      return (
        <span className={`${NAV} cursor-not-allowed border-none opacity-40`} aria-disabled="true" aria-label={label}>
          {icon}
        </span>
      )
    }
    return hrefFor ? (
      <Link to={hrefFor(n)} className={`${NAV} border-none`} aria-label={label}>{icon}</Link>
    ) : (
      <button type="button" className={`${NAV} border-none`} onClick={() => onChange(n)} aria-label={label}>{icon}</button>
    )
  }

  return (
    <nav className="mt-12 flex items-center justify-center gap-2" aria-label={ariaLabel}>

      <ul className="flex items-center flex-wrap gap-2">
        <li>{nav(page - 1, page <= 1, 'Previous page', <ChevronLeft className="size-5" aria-hidden />)}</li>
        {items.map((it) =>
          typeof it === 'string' ? (
            <li key={it}>
              <span className="inline-flex h-10 select-none items-center justify-center text-brand-slate" aria-hidden>
                …
              </span>
            </li>
          ) : (
            <li key={it}>{cell(it)}</li>
          )
        )}
        <li>{nav(page + 1, page >= pages, 'Next page', <ChevronRight className="size-5" aria-hidden />)}</li>
      </ul>

    </nav>
  )
}
