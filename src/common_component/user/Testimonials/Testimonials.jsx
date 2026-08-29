import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react'
import './Testimonials.css'

/**
 * Shared testimonials block — ONE look reused across the site (home, the
 * Services landing and each programme page). A continuously scrolling row that
 * moves left and shows ~2 cards at a time, pauses on hover, and loops
 * seamlessly. Each card carries the home-page treatment: quote mark, the quote,
 * a five-star rating and the person's name/role.
 *
 * Data shape per item: { id, quote, name, role, photo }. Renders nothing when
 * there are no items, so a page never shows an empty proof band.
 *
 * Props:
 *   items      – testimonials array
 *   eyebrow    – small crimson kicker above the title (optional)
 *   title      – section heading (optional)
 *   subtitle   – supporting line under the title (optional)
 *   footer     – node shown centred below the row, e.g. a "read all" link
 *   className  – <section> background/padding (ignored when `bare`)
 *   bare       – render just the inner block (no <section>/container), for
 *                embedding inside an existing section (the programme page)
 *   compact    – smaller heading + tighter spacing, for the embedded case
 */
function TestimonialCard({ t }) {
  return (
    <figure className="flex h-full flex-col rounded-xl border border-brand-navy/5 bg-white p-6 shadow-sm">
      <Quote className="size-8 fill-brand-crimson/15 text-brand-crimson" />
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-brand-navy/80">
        &ldquo;{t.quote}&rdquo;
      </blockquote>
      <div className="mt-5 flex items-center gap-1 text-brand-crimson">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-4 fill-current" />
        ))}
      </div>
      <figcaption className="mt-3 flex items-center gap-3 border-t border-brand-navy/10 pt-3">
        {t.photo && (
          <img src={t.photo} alt="" loading="lazy" className="size-10 rounded-full object-cover" />
        )}
        <div className="leading-tight">
          <strong className="block text-sm font-bold text-brand-navy">{t.name}</strong>
          {t.role && <span className="text-xs font-semibold text-brand-slate">{t.role}</span>}
        </div>
      </figcaption>
    </figure>
  )
}

/**
 * Stepped slider: shows `visible` cards (2 on desktop, 1 on a phone), holds ~5s,
 * then slides by exactly one card — the first card leaves, the rest shift over
 * and a new card enters. Prev/Next buttons drive it manually (and reset the
 * autoplay timer); it also pauses while the visitor hovers the row.
 *
 * The list is triple-buffered (three copies) and we sit in the middle copy, so
 * we can slide forward AND backward and wrap seamlessly by silently re-centring
 * into the middle copy (all copies are identical, so the jump is invisible).
 */
function Carousel({ items, compact }) {
  const n = items.length
  const [visible, setVisible] = useState(2)
  const canSlide = n > visible
  const stepPct = 100 / visible

  const [index, setIndex] = useState(() => (n > 2 ? n : 0))
  const [animate, setAnimate] = useState(true)
  const [paused, setPaused] = useState(false)
  const [resetKey, setResetKey] = useState(0) // bump = restart the autoplay timer
  const sliding = useRef(false)               // ignore clicks mid-transition

  // 1 card at a time on phones, 2 on wider screens.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(max-width: 640px)')
    const apply = () => setVisible(mq.matches ? 1 : 2)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // Sit at the middle copy's start; re-centre if the set or layout changes.
  useEffect(() => {
    setAnimate(false)
    setIndex(canSlide ? n : 0)
  }, [n, visible, canSlide])

  // Re-enable the transition on the frame after any instant (no-anim) jump.
  useEffect(() => {
    if (animate) return
    const r = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(r)
  }, [animate])

  // Autoplay: hold, then advance one card. Re-armed on hover / manual nav / resize.
  useEffect(() => {
    if (!canSlide || paused) return
    const id = setInterval(() => setIndex((i) => i + 1), 5000)
    return () => clearInterval(id)
  }, [canSlide, paused, resetKey, n, visible])

  const go = (dir) => {
    if (!canSlide || sliding.current) return
    sliding.current = true
    setResetKey((k) => k + 1)
    setIndex((i) => i + dir)
    setTimeout(() => { sliding.current = false }, 650) // ~transition length
  }

  // After a slide, if we've stepped onto a clone copy, jump back into the middle
  // copy with the transition off — same content, so it's invisible.
  const onSlideEnd = () => {
    if (!canSlide) return
    if (index >= 2 * n) { setAnimate(false); setIndex(index - n) }
    else if (index < n) { setAnimate(false); setIndex(index + n) }
  }

  const slideStyle = { flexBasis: `${stepPct}%`, maxWidth: `${stepPct}%` }
  const marginTop = compact ? 'mt-8' : 'mt-12'

  if (!canSlide) {
    return (
      <ul className={`testi-track testi-static ${marginTop}`}>
        {items.map((t, i) => (
          <li key={i} className="testi-slide" style={slideStyle}>
            <TestimonialCard t={t} />
          </li>
        ))}
      </ul>
    )
  }

  const slides = [...items, ...items, ...items] // triple-buffer for two-way wrap

  return (
    <div className={marginTop}>
      <div
        className="testi-viewport"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <ul
          className={`testi-track${animate ? ' is-animating' : ''}`}
          style={{ transform: `translateX(-${index * stepPct}%)` }}
          onTransitionEnd={onSlideEnd}
        >
          {slides.map((t, i) => (
            // Only the middle copy is real for assistive tech; the rest are clones.
            <li key={i} aria-hidden={i < n || i >= 2 * n} className="testi-slide" style={slideStyle}>
              <TestimonialCard t={t} />
            </li>
          ))}
        </ul>
      </div>

      <div className="testi-controls">
        <button type="button" className="testi-btn" aria-label="Previous testimonials" onClick={() => go(-1)}>
          <ChevronLeft size={20} strokeWidth={2.25} aria-hidden />
        </button>
        <button type="button" className="testi-btn" aria-label="Next testimonials" onClick={() => go(1)}>
          <ChevronRight size={20} strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </div>
  )
}

export default function Testimonials({
  items,
  eyebrow,
  title,
  subtitle,
  footer,
  className = 'bg-soft py-20 md:py-24',
  bare = false,
  compact = false,
}) {
  if (!items?.length) return null

  const inner = (
    <>
      {(eyebrow || title || subtitle) && (
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow && (
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-crimson">{eyebrow}</p>
          )}
          {title && (
            <h2
              className={`font-display font-extrabold tracking-tight text-brand-navy ${
                compact ? 'text-2xl' : 'mt-3 text-3xl sm:text-4xl'
              }`}
            >
              {title}
            </h2>
          )}
          {subtitle && <p className="mt-4 text-lg text-brand-slate">{subtitle}</p>}
        </div>
      )}

      <Carousel items={items} compact={compact} />

      {footer && <div className="mt-10 text-center">{footer}</div>}
    </>
  )

  if (bare) return <div>{inner}</div>

  return (
    <section className={className}>
      <div className="container">{inner}</div>
    </section>
  )
}
