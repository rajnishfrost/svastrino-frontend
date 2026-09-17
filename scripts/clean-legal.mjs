// Build-time helper: turns the Google-Docs markdown exports of the three policy
// pages into clean markdown the site's <Markdown> component renders well.
//
// Google Docs' markdown export leaves artifacts that the minimal renderer can't
// handle: backslash-escaped punctuation (\[18\], 15% \+ taxes), body text that
// carries a heading style (## a whole sentence.), heading styles applied to
// bullet items (- ## Explore ...), empty headings, and pipe tables (unsupported
// — converted to bullet lists here). Re-run after replacing a source file:
//   node scripts/clean-legal.mjs
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const contentDir = join(here, '..', 'src', 'content')
const outDir = join(contentDir, 'legal')

const SOURCES = [
  { src: 'T&C 2026.md', out: 'terms-of-use.md' },
  { src: 'Privacy Policy 2026.md', out: 'privacy-policy.md' },
  { src: 'Cancellation Policy 2026.md', out: 'cancellations-and-refunds.md' },
]

const splitRow = (row) =>
  row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())

function clean(md) {
  let text = md.replace(/\r\n/g, '\n')
  // Undo Google Docs' backslash escaping of markdown punctuation.
  text = text.replace(/\\([\\`*_{}[\]()#+\-.!>~|])/g, '$1')

  const lines = text.split('\n')
  const out = []
  let i = 0
  let titleStripped = false

  while (i < lines.length) {
    const raw = lines[i]
    const trimmed = raw.trim()

    // Drop leading blanks and the document's own H1 title — the page shows the
    // title in its hero band, so a repeat here would be a duplicate heading.
    if (!titleStripped) {
      if (!trimmed) { i++; continue }
      titleStripped = true
      if (/^#\s+/.test(trimmed)) { i++; continue }
    }

    // Pipe table (header row + dashes/colons separator) → bullet list, using the
    // header cells as labels for each value.
    if (/^\|.*\|$/.test(trimmed) && i + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[i + 1].trim())) {
      const headers = splitRow(trimmed)
      i += 2
      const rows = []
      while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) {
        rows.push(splitRow(lines[i].trim()))
        i++
      }
      if (out.length && out[out.length - 1] !== '') out.push('')
      const stripBold = (c) => c.replace(/\*\*/g, '').trim()
      for (const row of rows) {
        const label = stripBold(row[0] || '')
        const rest = row.slice(1)
          .map((cell, idx) => {
            const h = stripBold(headers[idx + 1] || '')
            const v = stripBold(cell)
            return h ? `${h}: ${v}` : v
          })
          .filter(Boolean)
          .join('; ')
        out.push(`- ${label ? `**${label}**` : ''}${rest ? ` — ${rest}` : ''}`)
      }
      out.push('')
      continue
    }

    // A bullet item that also carries a heading style: "- ## Explore" → "- Explore".
    const fixed = raw.replace(/^(\s*[-*]\s+)#{1,6}\s+/, '$1')

    const h = fixed.trim().match(/^(#{1,6})\s*(.*)$/)
    if (h) {
      const body = h[2].trim()
      if (!body) { i++; continue } // empty heading
      // A "heading" that ends in a full stop or runs long is really a paragraph
      // that Google Docs styled as a heading — demote it.
      const plain = body.replace(/\*\*/g, '')
      if (/\.$/.test(plain) || plain.length > 90) {
        out.push(body)
        i++
        continue
      }
      out.push(`${h[1]} ${body}`)
      i++
      continue
    }

    out.push(fixed)
    i++
  }

  // Google Docs puts a blank line between list items; the renderer's list loop
  // stops at a blank line, so those would each become a separate one-item list.
  // Drop blank lines that sit between two items of the same list type.
  const listKind = (s) => (/^\s*[-*]\s+/.test(s) ? 'ul' : /^\s*\d+\.\s+/.test(s) ? 'ol' : null)
  const compact = []
  for (let j = 0; j < out.length; j++) {
    if (out[j].trim() === '') {
      const prev = compact[compact.length - 1] || ''
      const next = out[j + 1] || ''
      if (listKind(prev) && listKind(prev) === listKind(next)) continue
    }
    compact.push(out[j])
  }

  return compact.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

fs.mkdirSync(outDir, { recursive: true })
for (const { src, out } of SOURCES) {
  const raw = fs.readFileSync(join(contentDir, src), 'utf8')
  const cleaned = clean(raw)
  fs.writeFileSync(join(outDir, out), cleaned)
  console.log(`  ✓ ${src} → legal/${out} (${cleaned.length} chars)`)
}
console.log('✓ Legal content cleaned.')
