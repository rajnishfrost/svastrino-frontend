# Nirmaan — Colour System

The rule that keeps **every** Nirmaan page (landing, learn, checkout, receipt…)
looking like one product. Palette values come from
`svastrino_resources/A-natural.html`.

## The 3 roles

| Role | Colour | Token(s) | Used for |
|------|--------|----------|----------|
| **Canvas** | White + warm **Cream** `#faf6ec` / `#f1ead5` | `--color-bg`, `--color-surface`, `--gray-50/100/200` | Page background (white), cards, sections, panels, worksheet boxes, borders |
| **Ink** | **Brown** `#3b2822` (muted `#5a3f33`) | `--color-text`, `--color-text-muted`, `--navy` | Body text, descriptions, list items, muted text, **footer & dark bands** |
| **Action / Lead** | **Green** `#3f7932` (dark `#2d5723`) | `--color-heading`, `--color-primary`, `--color-accent`, `--blue` | **Headings & titles**, buttons, links, progress bars, active/selected state, checkmarks, badges, step numbers, icons |

**One line:** _Cream = canvas · Brown = body text + footer · Green = headings + everything interactive._

Proportion, roughly: **~60% cream/white · ~30% brown · ~10% green.** Green is the
lead/accent — it should draw the eye to titles and to what you can click.

## Why it stays consistent (don't hardcode colours)

The colours live in **one place**, not per page:

- `client/src/styles/theme.css` — raw `--nirmaan-*` values (single source of truth).
- `client/src/styles/nirmaan.css` — the `.theme-nirmaan` block **maps** those onto
  the normal component token names (`--color-heading`, `--color-text`, `--navy`, …).

Every Nirmaan page just adds the `theme-nirmaan` class to `<body>` (done on mount by
`Nirmaan.jsx` and `Learn.jsx`) and uses the **shared tokens**. So a new page inherits
the exact look automatically — **never** put a raw hex or a Svastrino-blue token on a
Nirmaan page; use the semantic token and it themes itself.

## Do / Don't

- ✅ Headings & titles → green (`--color-heading` handles this globally).
- ✅ Body/paragraph/list text → brown (`--color-text`).
- ✅ Any button, link, progress, active/selected, check, badge → green (`--color-accent` / `--color-primary`).
- ✅ Footer & any dark band → brown (`--navy` / `--color-inverse-bg`).
- ✅ Cards / sections / panels → cream (`--color-surface`).
- ❌ Don't hardcode hex on a page — add or reuse a token.
- ❌ Don't use Svastrino navy/blue on Nirmaan (the only exception: the navbar
  "SVASTRINO" wordmark stays navy `#0f2c5c`, because the brand is always Svastrino).
- ❌ Don't make body text green or headings brown — that flips the balance.

## Exact values (from A-natural)

```
--nirmaan-brown:      #3b2822   /* body text, footer, dark bands            */
--nirmaan-brown-soft: #5a3f33   /* muted / secondary text                   */
--nirmaan-green:      #3f7932   /* actions & accents                        */
--nirmaan-green-dark: #2d5723   /* headings, hover, active                  */
--nirmaan-cream:      #faf6ec   /* warm surface (cards, sections)           */
--nirmaan-cream-dark: #f1ead5   /* cream borders / chips                    */
--nirmaan-olive:      #90743c   /* small warm accent (e.g. section eyebrows)*/
```
