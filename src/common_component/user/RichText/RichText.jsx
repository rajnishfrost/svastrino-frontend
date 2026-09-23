import { Fragment } from 'react'
import { Check } from 'lucide-react'

/**
 * Renders an Editor.js document as React elements.
 *
 * A course page IS one of these documents now — whatever an admin writes in the
 * panel is what a reader sees, in that order — so this file decides what the
 * page can contain. Its list of block types has to match the one the server
 * keeps in richText.js: a block the server stores but this can't draw would
 * vanish on the page while still sitting in the database, which is worse than
 * refusing it at the door.
 *
 * Like Markdown.jsx next door, nothing goes through dangerouslySetInnerHTML. A
 * block's text carries a little inline markup (`<b>`, `<a>`, `<mark>`…) and
 * that is parsed against an allowlist into real elements, so anything else can
 * only ever come out as text.
 */

// Inline tags the editor can produce. Everything else is unwrapped to its text.
const INLINE = /<(\/)?(b|strong|i|em|u|mark|code|br|a)(\s[^>]*)?>/gi

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", nbsp: ' ' }
const decode = (s) => s.replace(/&(#?\w+);/g, (m, e) => ENTITIES[e.toLowerCase()] ?? m)

const TAGS = { b: 'strong', strong: 'strong', i: 'em', em: 'em', u: 'u', mark: 'mark', code: 'code' }

// http(s), a path on this site, or an email — a `javascript:` href renders as
// plain text rather than a link.
const safeHref = (href) => (/^(https?:\/\/|\/|mailto:)/i.test(href || '') ? href : null)

// Kept in step with EMBED_HOSTS on the server: an embed runs someone else's
// code in the page, so an unrecognised one is not framed at all.
const EMBED_HOSTS = /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com)\//i

/** Parse a block's text into a tree of {tag, href, children}. */
function parseInline(html) {
  const src = String(html ?? '')
  const root = { children: [] }
  const stack = [root]
  const top = () => stack[stack.length - 1]

  let last = 0
  let m
  INLINE.lastIndex = 0
  while ((m = INLINE.exec(src))) {
    const text = src.slice(last, m.index)
    if (text) top().children.push(decode(text))
    last = INLINE.lastIndex

    const [, closing, rawTag, attrs] = m
    const tag = rawTag.toLowerCase()

    if (tag === 'br') {
      top().children.push({ tag: 'br', children: [] })
      continue
    }
    if (closing) {
      // Close the nearest open tag of this name; a stray `</b>` is ignored.
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) { stack.length = i; break }
      }
      continue
    }

    const node = { tag, children: [] }
    if (tag === 'a') {
      const href = attrs?.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i)
      node.href = safeHref(decode(href?.[1] ?? href?.[2] ?? href?.[3] ?? ''))
    }
    top().children.push(node)
    stack.push(node)
  }

  const tail = src.slice(last)
  if (tail) top().children.push(decode(tail))
  return root.children
}

function toElements(nodes, key) {
  return nodes.map((n, i) => {
    const k = `${key}-${i}`
    if (typeof n === 'string') return <Fragment key={k}>{n}</Fragment>
    if (n.tag === 'br') return <br key={k} />
    if (n.tag === 'a') {
      const kids = toElements(n.children, k)
      if (!n.href) return <Fragment key={k}>{kids}</Fragment>
      const external = /^https?:\/\//i.test(n.href)
      return (
        <a
          key={k}
          href={n.href}
          className="font-semibold text-brand-crimson hover:underline"
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {kids}
        </a>
      )
    }
    const Tag = TAGS[n.tag] || 'span'
    return <Tag key={k}>{toElements(n.children, k)}</Tag>
  })
}

const Inline = ({ html, k }) => <>{toElements(parseInline(html), k)}</>

const HEADING = {
  2: 'border-b border-brand-navy/10 pb-2 font-display text-2xl font-bold text-brand-navy',
  3: 'font-display text-lg font-bold text-brand-navy',
  4: 'font-display text-base font-bold text-brand-navy',
}
const HEADING_TOP = { 2: 'mt-10', 3: 'mt-8', 4: 'mt-6' }

const ALIGN = { center: 'text-center', right: 'text-right', justify: 'text-justify', left: 'text-left' }
const alignOf = (b) => ALIGN[b?.tunes?.alignment?.alignment] || ''

/** A list and its nested children — the editor allows indenting a point. */
function Items({ items, style, k }) {
  const Tag = style === 'ordered' ? 'ol' : 'ul'
  return (
    <Tag className={`${style === 'ordered' ? 'list-decimal' : 'list-disc'} space-y-1.5 pl-5 marker:text-brand-crimson`}>
      {items.map((it, i) => {
        const item = typeof it === 'string' ? { content: it, items: [] } : it
        return (
          <li key={`${k}-${i}`} className="leading-relaxed text-brand-slate">
            <Inline html={item.content} k={`${k}-${i}`} />
            {item.items?.length > 0 && (
              <div className="mt-1.5">
                <Items items={item.items} style={style} k={`${k}-${i}-n`} />
              </div>
            )}
          </li>
        )
      })}
    </Tag>
  )
}

/** The text of a cell, with its markup and entities resolved away. */
const plain = (html) => decode(String(html ?? '').replace(/<[^>]*>/g, '')).trim()

/**
 * How wide a cell is asking to be, in characters: the longest of its lines. A
 * cell broken over two lines wants the width of its longer half, not the sum of
 * both. Capped, so one runaway sentence can't take the whole table.
 */
const demand = (cell) =>
  Math.min(120, Math.max(0, ...String(cell ?? '').split(/<br\s*\/?>/i).map((line) => plain(line).length)))

/**
 * Column widths, in percent, for every table in a document.
 *
 * Letting each table size its own columns is what a browser does by default,
 * and it leaves two tables on the same subject — institutes in India, then
 * abroad — with columns that stop at different places, which reads as two
 * unrelated tables. So tables that share a heading row are measured together
 * and come out identical, while a table with headings of its own is free to fit
 * its own text: a column of job titles has no business being as wide as the
 * column of sentences describing them.
 *
 * Inside a table the columns divide the width by a damped average of their
 * demand rather than by the demand itself. A column of one-word locations
 * should be narrower than a column of sentences, but not nine times narrower —
 * undamped, the short column ends up too thin to read.
 */

// Measured against the career-library tables rather than picked: a little below
// a square root is where a two-line salary figure stops spilling onto a third
// line while a column of job titles stays visibly narrower than the column of
// sentences describing them.
const DAMPING = 0.45

function columnWidths(list) {
  const groups = new Map()

  list.forEach((b, i) => {
    if (b?.type !== 'table') return
    const rows = (Array.isArray(b.data?.content) ? b.data.content : []).filter(Array.isArray)
    if (!rows.length) return

    const cols = Math.max(...rows.map((row) => row.length))
    // Same headings, same widths. A table without headings is measured alone —
    // there is nothing to say it belongs with any other.
    const key = b.data?.withHeadings ? `${cols}:${rows[0].map(plain).join('|').toLowerCase()}` : `alone:${i}`
    const group = groups.get(key) || { blocks: [], cols, total: [], count: [] }
    rows.forEach((row) =>
      row.forEach((cell, c) => {
        group.total[c] = (group.total[c] || 0) + demand(cell)
        group.count[c] = (group.count[c] || 0) + 1
      }),
    )
    group.blocks.push(i)
    groups.set(key, group)
  })

  const widths = new Map()
  groups.forEach((group) => {
    // A floor per column: an empty one still needs somewhere to put a word.
    const weights = Array.from({ length: group.cols }, (_, c) =>
      Math.pow(Math.max(6, (group.total[c] || 0) / (group.count[c] || 1)), DAMPING),
    )
    const sum = weights.reduce((a, w) => a + w, 0)
    const percents = weights.map((w) => `${((w / sum) * 100).toFixed(2)}%`)
    group.blocks.forEach((i) => widths.set(i, percents))
  })

  return widths
}

/**
 * A table scrolls inside its own box rather than widening the page — salary
 * columns are wide, and a phone is narrow.
 *
 * Its columns are fixed rather than left to the browser, at the widths
 * columnWidths worked out for the whole document.
 */
function Table({ data, widths, k }) {
  const rows = Array.isArray(data.content) ? data.content : []
  if (!rows.length) return null
  const [head, ...body] = data.withHeadings ? rows : [null, ...rows]

  const cols = Math.max(...rows.map((row) => (Array.isArray(row) ? row.length : 0)))
  if (!cols) return null
  const sizes = widths?.length === cols ? widths : Array.from({ length: cols }, () => `${100 / cols}%`)

  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-brand-navy/10">
      <table className="w-full min-w-[36rem] table-fixed border-collapse text-left text-sm">
        <colgroup>
          {sizes.map((w, i) => (
            <col key={i} style={{ width: w }} />
          ))}
        </colgroup>
        {head && (
          <thead className="bg-brand-cream">
            <tr>
              {head.map((cell, i) => (
                <th
                  key={i}
                  className="break-words border-b border-brand-navy/10 px-4 py-3 font-display font-bold text-brand-navy"
                >
                  <Inline html={cell} k={`${k}-h-${i}`} />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {body.map((row, r) => (
            <tr key={r} className="border-b border-brand-navy/5 last:border-0">
              {row.map((cell, c) => (
                <td key={c} className="break-words px-4 py-3 align-top leading-relaxed text-brand-slate">
                  <Inline html={cell} k={`${k}-${r}-${c}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Checklist({ items, k }) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((it, i) => (
        <li key={`${k}-${i}`} className="flex items-start gap-2.5 leading-relaxed text-brand-slate">
          <span
            className={`mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded border ${
              it.checked ? 'border-brand-crimson bg-brand-crimson text-white' : 'border-brand-navy/25 bg-white'
            }`}
          >
            {it.checked && <Check className="size-3" strokeWidth={3} />}
          </span>
          <Inline html={it.text} k={`${k}-${i}`} />
        </li>
      ))}
    </ul>
  )
}

export default function RichText({ blocks = [], className = '' }) {
  const list = blocksOf(blocks)
  if (!list.length) return null
  const widths = columnWidths(list)

  return (
    <div className={className}>
      {list.map((b, i) => {
        const k = `b${i}`
        const first = i === 0
        const data = b?.data || {}
        const align = alignOf(b)

        switch (b?.type) {
          case 'header': {
            const level = [2, 3, 4].includes(Number(data.level)) ? Number(data.level) : 2
            const Tag = `h${level}`
            return (
              <Tag key={k} className={`${first ? '' : HEADING_TOP[level]} ${HEADING[level]} ${align}`}>
                <Inline html={data.text} k={k} />
              </Tag>
            )
          }

          case 'list':
            return (
              <div key={k} className={first ? '' : 'mt-4'}>
                <Items items={data.items || []} style={data.style === 'ordered' ? 'ordered' : 'unordered'} k={k} />
              </div>
            )

          case 'checklist':
            return <Checklist key={k} items={data.items || []} k={k} />

          case 'table':
            return <Table key={k} data={data} widths={widths.get(i)} k={k} />

          case 'quote':
            return (
              <blockquote key={k} className={`${first ? '' : 'mt-6'} border-l-4 border-brand-crimson/30 pl-4 italic text-brand-navy`}>
                <Inline html={data.text} k={k} />
                {data.caption && (
                  <cite className="mt-1 block text-xs not-italic text-brand-slate">
                    <Inline html={data.caption} k={`${k}-c`} />
                  </cite>
                )}
              </blockquote>
            )

          case 'delimiter':
            return <hr key={k} className="mx-auto mt-8 w-24 border-t border-brand-navy/15" />

          case 'image': {
            const src = data.file?.url || data.url
            if (!src) return null
            return (
              <figure key={k} className={`mt-6 ${data.stretched ? '' : 'mx-auto'}`}>
                <img
                  src={src}
                  alt={String(data.caption || '').replace(/<[^>]*>/g, '') || ''}
                  loading="lazy"
                  className={`w-full rounded-xl ${data.withBorder ? 'border border-brand-navy/15' : ''} ${
                    data.withBackground ? 'bg-brand-cream p-4' : ''
                  }`}
                />
                {data.caption && (
                  <figcaption className="mt-2 text-center text-xs text-brand-slate">
                    <Inline html={data.caption} k={`${k}-c`} />
                  </figcaption>
                )}
              </figure>
            )
          }

          case 'embed': {
            if (!EMBED_HOSTS.test(String(data.embed || ''))) return null
            return (
              <figure key={k} className="mt-6">
                <div className="relative w-full overflow-hidden rounded-xl pt-[56.25%]">
                  <iframe
                    src={data.embed}
                    title={String(data.caption || data.service || 'Embedded video').replace(/<[^>]*>/g, '')}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="absolute inset-0 size-full border-0"
                  />
                </div>
                {data.caption && (
                  <figcaption className="mt-2 text-center text-xs text-brand-slate">
                    <Inline html={data.caption} k={`${k}-c`} />
                  </figcaption>
                )}
              </figure>
            )
          }

          default:
            return (
              <p key={k} className={`${first ? '' : 'mt-4'} leading-relaxed text-brand-slate ${align}`}>
                <Inline html={data.text} k={k} />
              </p>
            )
        }
      })}
    </div>
  )
}

/** Blocks out of either an Editor.js document or a bare array of blocks. */
function blocksOf(input) {
  return Array.isArray(input) ? input : Array.isArray(input?.blocks) ? input.blocks : []
}
