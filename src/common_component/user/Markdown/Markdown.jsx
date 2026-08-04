import { Fragment } from 'react'
import './Markdown.css'

/**
 * Minimal markdown renderer for blog bodies.
 *
 * Deliberately dependency-free and renders to React elements (never
 * dangerouslySetInnerHTML), so untrusted content can't inject markup. Supports
 * the subset the migrated posts actually use: headings, bold/italic, links,
 * bullet + numbered lists, blockquotes, rules and paragraphs.
 */

// ---- inline: **bold**, *italic*, [text](url) --------------------------------
const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g

function renderInline(text, keyPrefix = '') {
  return text.split(INLINE).filter(Boolean).map((chunk, i) => {
    const key = `${keyPrefix}-${i}`

    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      return <strong key={key}>{chunk.slice(2, -2)}</strong>
    }
    if ((chunk.startsWith('*') && chunk.endsWith('*')) || (chunk.startsWith('_') && chunk.endsWith('_'))) {
      return <em key={key}>{chunk.slice(1, -1)}</em>
    }

    const link = chunk.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) {
      const [, label, href] = link
      // Only allow http(s) and relative targets — blocks javascript: URLs.
      const safe = /^(https?:\/\/|\/)/i.test(href) ? href : '#'
      const external = safe.startsWith('http')
      return (
        <a key={key} href={safe} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {label}
        </a>
      )
    }

    return <Fragment key={key}>{chunk}</Fragment>
  })
}

// ---- block parsing ----------------------------------------------------------
export default function Markdown({ children = '' }) {
  const lines = String(children).replace(/\r\n/g, '\n').split('\n')
  const blocks = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) { i++; continue }

    // Horizontal rule
    if (/^---+$/.test(trimmed)) {
      blocks.push(<hr key={`hr-${i}`} />)
      i++
      continue
    }

    // Heading (#### … #)
    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      const level = Math.min(6, heading[1].length + 1) // shift down: ## in body → h3 on page
      const Tag = `h${Math.min(6, Math.max(2, level))}`
      blocks.push(<Tag key={`h-${i}`}>{renderInline(heading[2], `h${i}`)}</Tag>)
      i++
      continue
    }

    // Blockquote (consecutive '>' lines)
    if (trimmed.startsWith('>')) {
      const quote = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quote.push(lines[i].trim().replace(/^>\s?/, ''))
        i++
      }
      blocks.push(<blockquote key={`q-${i}`}>{renderInline(quote.join(' '), `q${i}`)}</blockquote>)
      continue
    }

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      const items = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''))
        i++
      }
      blocks.push(
        <ul key={`ul-${i}`}>
          {items.map((it, n) => <li key={n}>{renderInline(it, `ul${i}-${n}`)}</li>)}
        </ul>
      )
      continue
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
        i++
      }
      blocks.push(
        <ol key={`ol-${i}`}>
          {items.map((it, n) => <li key={n}>{renderInline(it, `ol${i}-${n}`)}</li>)}
        </ol>
      )
      continue
    }

    // Paragraph — join until a blank line or the start of another block.
    const para = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6}\s|>|[-*]\s|\d+\.\s|---+$)/.test(lines[i].trim())
    ) {
      para.push(lines[i].trim())
      i++
    }
    if (para.length) {
      blocks.push(<p key={`p-${i}`}>{renderInline(para.join(' '), `p${i}`)}</p>)
    }
  }

  return <div className="markdown">{blocks}</div>
}
