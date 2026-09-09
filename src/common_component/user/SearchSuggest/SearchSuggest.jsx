import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * A search box that offers the matches it already knows about.
 *
 * Typing "acc" in the career library and pressing Search reloads a page of
 * results; most of the time the reader already knows which one they wanted, and
 * the page load is in the way. So the five closest matches are offered under the
 * box and go straight to that page — the search itself still works exactly as it
 * did, for when the list IS the answer.
 *
 * The parent owns the query text and what Search does with it; this only knows
 * how to ask for matches, which is the `suggest` prop:
 *
 *     suggest(query, { signal }) → [{ key, label, sub, to }]
 *
 * Every keystroke would otherwise be a request, so they are debounced, and a
 * reply that arrives after the query moved on is dropped — otherwise a slow
 * lookup for "acc" lands on top of the results for "account".
 */
const ICON_LEFT = 12   // matches the box's own left padding
const ICON_SIZE = 16
const DEBOUNCE_MS = 200
const MIN_CHARS = 2
const MAX_ITEMS = 5

/** The typed part of a match, shown in bold so the reason it matched is visible. */
function Highlight({ text, query }) {
  const i = String(text).toLowerCase().indexOf(String(query).toLowerCase())
  if (!query || i < 0) return text
  return (
    <>
      {text.slice(0, i)}
      <strong className="font-bold text-brand-navy">{text.slice(i, i + query.length)}</strong>
      {text.slice(i + query.length)}
    </>
  )
}

export default function SearchSuggest({
  value,
  onChange,
  suggest,
  placeholder,
  ariaLabel,
  icon: Icon,
  className = '',
  emptyLabel = 'No matches',
}) {
  const navigate = useNavigate()
  const listId = useId()
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1)
  // A pick navigates away; the box shouldn't reopen on the way out.
  const picked = useRef(false)

  const query = value.trim()

  useEffect(() => {
    if (picked.current) {
      picked.current = false
      return
    }
    if (query.length < MIN_CHARS) {
      setItems([])
      setOpen(false)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const found = await suggest(query, { signal: controller.signal })
        if (controller.signal.aborted) return
        setItems((found || []).slice(0, MAX_ITEMS))
        setActive(-1)
        setOpen(true)
      } catch {
        // An aborted or failed lookup just means no suggestions — the search
        // button still works, so there is nothing to report here.
        if (!controller.signal.aborted) setItems([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [query, suggest])

  const pick = (item) => {
    picked.current = true
    setOpen(false)
    setActive(-1)
    navigate(item.to)
  }

  const onKeyDown = (e) => {
    if (!open || !items.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1))
    } else if (e.key === 'Enter' && active >= 0) {
      // Only when one is highlighted — otherwise Enter is still "search".
      e.preventDefault()
      pick(items[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  const showList = open && query.length >= MIN_CHARS

  return (
    <div className={`relative ${className}`}>
      {/* The icon sits inside the box and the text starts after it. Both are
          set here rather than through utility classes: this file has to be
          listed in tailwind.config.js for its classes to exist at all, and a
          box whose text runs underneath its own icon is too easy a thing to
          ship by forgetting that. */}
      {Icon && (
        <Icon
          className="pointer-events-none absolute text-brand-slate"
          style={{ left: ICON_LEFT, top: '50%', transform: 'translateY(-50%)', width: ICON_SIZE, height: ICON_SIZE }}
        />
      )}
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ paddingLeft: Icon ? ICON_LEFT + ICON_SIZE + 8 : 14, paddingRight: Icon ? 12 : 14 }}
        onKeyDown={onKeyDown}
        onFocus={() => items.length && setOpen(true)}
        onBlur={() => { setOpen(false); setActive(-1) }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        className="h-10 w-full rounded-lg border border-brand-navy/15 bg-white text-sm text-brand-navy placeholder:text-brand-slate/60 focus:border-brand-crimson focus:outline-none focus:ring-2 focus:ring-brand-crimson/15"
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          // Keeping focus on the input means the blur that closes this list
          // doesn't fire before the click that picks from it.
          onMouseDown={(e) => e.preventDefault()}
          style={{ top: 48, left: 0, right: 0, zIndex: 30 }}
          className="absolute overflow-hidden rounded-lg border border-brand-navy/10 bg-white py-1 text-left shadow-lg shadow-brand-navy/10"
        >
          {items.map((item, i) => (
            <li
              key={item.key}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(item)}
              className={`cursor-pointer px-3.5 py-2 text-sm ${i === active ? 'bg-brand-rose' : ''}`}
            >
              <span className="block truncate text-brand-navy">
                <Highlight text={item.label} query={query} />
              </span>
              {item.sub && <span className="mt-0.5 block truncate text-xs text-brand-slate">{item.sub}</span>}
            </li>
          ))}

          {!items.length && (
            <li className="px-3.5 py-2 text-sm text-brand-slate">{loading ? 'Searching…' : emptyLabel}</li>
          )}
        </ul>
      )}
    </div>
  )
}
