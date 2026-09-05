/**
 * Decorative bottom wave that transitions between sections.
 * `color` is the fill of the section that comes *next*.
 */
export default function Wave({ color = '#ffffff', className = '' }) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 bottom-0 leading-none ${className}`}>
      {/* `block` removes the inline-SVG baseline gap that would otherwise let the
          section background show through as a hairline under the wave. */}
      <svg viewBox="0 0 1440 110" preserveAspectRatio="none" className="block h-[70px] w-full md:h-[110px]">
        <path
          fill={color}
          d="M0,64 C240,110 480,110 720,80 C960,50 1200,20 1440,48 L1440,110 L0,110 Z"
        />
      </svg>
    </div>
  )
}
