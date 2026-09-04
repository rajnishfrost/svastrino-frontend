import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react'

/**
 * About · "Media recognition" — the newspaper clippings, shown as a card grid.
 * Clicking a card opens a lightbox that shows the full clipping with zoom
 * in/out (buttons, double-click, drag-to-pan) and prev/next navigation.
 *
 * Images live in /public/assets/images. Add or reorder entries here as new
 * clippings come in.
 */
const NEWSPAPERS = [
  { src: '/assets/images/newspaper-recognition.jpg', alt: 'Svastrino featured in ET Ascent — “Grooming financial minds”' },
  { src: '/assets/images/newspaper-02.jpg', alt: 'Svastrino featured in the press' },
  { src: '/assets/images/newspaper-03.jpg', alt: 'Svastrino featured in the press' },
  { src: '/assets/images/newspaper-04.jpg', alt: 'Svastrino featured in the press' },
  { src: '/assets/images/newspaper-05.jpg', alt: 'Svastrino featured in the press' },
  { src: '/assets/images/newspaper-06.jpg', alt: 'Svastrino featured in the press' },
]

const MIN_SCALE = 1
const MAX_SCALE = 4

function Lightbox({ images, index, onClose, onIndex }) {
  const n = images.length
  const current = images[index]
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef(null)

  const reset = () => { setScale(1); setOffset({ x: 0, y: 0 }) }
  const prev = () => onIndex((index - 1 + n) % n)
  const next = () => onIndex((index + 1) % n)
  const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, +(s + 0.5).toFixed(1)))
  const zoomOut = () =>
    setScale((s) => {
      const v = Math.max(MIN_SCALE, +(s - 0.5).toFixed(1))
      if (v === 1) setOffset({ x: 0, y: 0 })
      return v
    })

  // Reset the zoom/pan whenever the shown image changes.
  useEffect(reset, [index])

  // Lock the page behind the modal while it is open.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prevOverflow }
  }, [])

  // Keyboard: Esc closes, arrows navigate, +/- zoom.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === '+' || e.key === '=') zoomIn()
      else if (e.key === '-' || e.key === '_') zoomOut()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [index]) // eslint-disable-line react-hooks/exhaustive-deps

  const onPointerDown = (e) => {
    if (scale <= 1) return
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!drag.current) return
    setOffset({ x: drag.current.ox + (e.clientX - drag.current.x), y: drag.current.oy + (e.clientY - drag.current.y) })
  }
  const stopDrag = () => { drag.current = null }

  // NOTE: Tailwind Preflight is off in this project, so a <button> keeps the
  // browser's default border unless we zero it — hence the explicit border-0.
  const ctrlBtn =
    'flex size-9 cursor-pointer items-center justify-center rounded-full border-0 bg-brand-crimson text-white transition-colors hover:bg-brand-crimson-dark disabled:cursor-not-allowed disabled:opacity-40'
  const navBtn =
    'absolute top-1/2 z-10 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-brand-crimson text-white transition-colors hover:bg-brand-crimson-dark'

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Newspaper clipping viewer"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 p-4 text-white" onClick={(e) => e.stopPropagation()}>
        <span className="text-sm font-medium text-white/80">{index + 1} / {n}</span>
        <div className="flex items-center gap-2">
          <button type="button" className={ctrlBtn} onClick={zoomOut} disabled={scale <= MIN_SCALE} aria-label="Zoom out">
            <ZoomOut className="size-5" />
          </button>
          <span className="w-12 text-center text-sm tabular-nums text-white/80">{Math.round(scale * 100)}%</span>
          <button type="button" className={ctrlBtn} onClick={zoomIn} disabled={scale >= MAX_SCALE} aria-label="Zoom in">
            <ZoomIn className="size-5" />
          </button>
          <button type="button" className={`${ctrlBtn} ml-2`} onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Image stage — clicking the dark area closes; the image and arrows don't. */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-6">
        {n > 1 && (
          <button type="button" className={`${navBtn} left-3`} onClick={(e) => { e.stopPropagation(); prev() }} aria-label="Previous">
            <ChevronLeft className="size-6" />
          </button>
        )}

        <img
          src={current.src}
          alt={current.alt}
          decoding="async"
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={() => (scale > 1 ? reset() : setScale(2))}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            cursor: scale > 1 ? 'grab' : 'zoom-in',
          }}
          className="max-h-full max-w-full touch-none select-none rounded-lg object-contain shadow-2xl"
        />

        {n > 1 && (
          <button type="button" className={`${navBtn} right-3`} onClick={(e) => { e.stopPropagation(); next() }} aria-label="Next">
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default function MediaRecognition() {
  const [open, setOpen] = useState(null) // index of the open clipping, or null

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="container text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-crimson">Media recognition</p>
        <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-navy">
          Reflections of our impact through National Newspapers
        </h2>

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-2 md:grid-cols-3">
          {NEWSPAPERS.map((paper, i) => (
            <button
              key={paper.src}
              type="button"
              onClick={() => setOpen(i)}
              className="group relative block overflow-hidden rounded-2xl border border-brand-navy/10 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-navy/10"
              aria-label="Open newspaper clipping"
            >
              <img
                src={paper.src}
                alt={paper.alt}
                loading="lazy"
                decoding="async"
                className="aspect-[4/5] w-full object-cover object-top"
              />
              {/* Hover veil + zoom hint */}
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-brand-navy/0 transition-colors group-hover:bg-brand-navy/25">
                <span className="flex size-12 items-center justify-center rounded-full bg-white/95 text-brand-navy opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  <ZoomIn className="size-5" />
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {open !== null && (
        <Lightbox images={NEWSPAPERS} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
      )}
    </section>
  )
}
