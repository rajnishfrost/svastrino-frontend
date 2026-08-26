/**
 * Animated line-emblems for the programs / skill-build products — small on
 * cards, large in the program hero. Purely SVG (a few KB, no image files),
 * drawn in `currentColor` so the parent picks the brand colour (crimson for
 * services, Nirmaan green for skill-build).
 *
 * Animation style follows the design-flow reference: SMIL animations INSIDE the
 * SVG — a rotating dashed halo, a stroke "draw-on" of the core shape, and a
 * gentle pulse — rather than CSS keyframes. Self-contained per icon.
 */

// Decide once whether the visitor asked for reduced motion. Decorative only, so
// a static read at module load is fine; when reduced we omit the <animate> tags.
const REDUCED =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

const svgProps = {
  viewBox: '0 0 64 64',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 3,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  style: { width: '100%', height: '100%', display: 'block', overflow: 'visible' },
  'aria-hidden': true,
}

/* ---- tiny SMIL helpers (return null when reduced-motion is on) ---- */
// A rotating dashed halo ring around the icon.
function Halo({ r = 29, dur = 16, reverse = false, dash = '2.5 7', op = 0.4 }) {
  return (
    <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray={dash} opacity={op}>
      {!REDUCED && (
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`${reverse ? 360 : 0} 32 32`}
          to={`${reverse ? 0 : 360} 32 32`}
          dur={`${dur}s`}
          repeatCount="indefinite"
        />
      )}
    </circle>
  )
}
// Draw-on props + <animate> for a path/shape of known length `len`.
const drawProps = (len) => (REDUCED ? {} : { strokeDasharray: len, strokeDashoffset: len })
const DrawAnim = ({ len, dur = '1.1s', begin = '0s' }) =>
  REDUCED ? null : (
    <animate attributeName="stroke-dashoffset" from={len} to="0" dur={dur} begin={begin} fill="freeze" />
  )
const Pulse = ({ attr = 'opacity', values = '0.5;1;0.5', dur = '2.4s', begin = '0s' }) =>
  REDUCED ? null : (
    <animate attributeName={attr} values={values} dur={dur} begin={begin} repeatCount="indefinite" />
  )
const Spin = ({ values, dur }) =>
  REDUCED ? null : (
    <animateTransform attributeName="transform" type="rotate" values={values} dur={dur} repeatCount="indefinite" />
  )

function BullsEye() {
  return (
    <svg {...svgProps}>
      <Halo />
      <circle cx="32" cy="32" r="18" opacity="0.85" {...drawProps(113)}>
        <DrawAnim len={113} dur="1.2s" />
      </circle>
      <circle cx="32" cy="32" r="10" opacity="0.9" {...drawProps(63)}>
        <DrawAnim len={63} dur="0.9s" begin="0.3s" />
      </circle>
      <circle cx="32" cy="32" r="3.4" />
      <circle cx="32" cy="32" r="1.8" fill="currentColor" stroke="none">
        <Pulse attr="r" values="1.8;2.8;1.8" dur="2.2s" />
      </circle>
      {/* fletched dart into the centre from upper-right */}
      <g {...drawProps(40)}>
        <line x1="32" y1="32" x2="52" y2="12" />
        <path d="M52 12 l-7 1.5 M52 12 l1.5 -7 M47 17 l-6.5 1.4 M47 17 l1.4 -6.5" />
        <DrawAnim len={40} dur="0.8s" begin="0.7s" />
      </g>
    </svg>
  )
}

function Bloom() {
  return (
    <svg {...svgProps}>
      <Halo />
      <path d="M16 50 q16 -8 32 0" opacity="0.85" {...drawProps(38)}>
        <DrawAnim len={38} dur="0.7s" />
      </path>
      <path d="M32 50 v-16" {...drawProps(16)}>
        <DrawAnim len={16} dur="0.5s" begin="0.3s" />
      </path>
      <g>
        {!REDUCED && (
          <animateTransform attributeName="transform" type="rotate" values="0 32 46;-5 32 46;0 32 46;5 32 46;0 32 46" dur="4s" repeatCount="indefinite" />
        )}
        <path d="M32 40 q-13 -1 -15 -15 q13 1 15 15" {...drawProps(46)}>
          <DrawAnim len={46} dur="0.8s" begin="0.6s" />
        </path>
        <path d="M32 36 q13 -1 15 -15 q-13 1 -15 15" {...drawProps(46)}>
          <DrawAnim len={46} dur="0.8s" begin="0.9s" />
        </path>
      </g>
    </svg>
  )
}

function Breakthrough() {
  return (
    <svg {...svgProps}>
      <Halo />
      <path d="M14 52 q18 -12 36 0" opacity="0.85" {...drawProps(42)}>
        <DrawAnim len={42} dur="0.7s" />
      </path>
      <path d="M30 50 v-34" {...drawProps(34)}>
        <DrawAnim len={34} dur="0.6s" begin="0.3s" />
      </path>
      <g>
        {!REDUCED && (
          <animateTransform attributeName="transform" type="rotate" values="0 30 18;-6 30 18;3 30 18;0 30 18" dur="2.8s" repeatCount="indefinite" />
        )}
        <path d="M30 16 h16 l-5 6 l5 6 h-16" fill="currentColor" fillOpacity="0.12" {...drawProps(52)}>
          <DrawAnim len={52} dur="0.8s" begin="0.7s" />
        </path>
      </g>
      <g strokeWidth="2.6">
        <path d="M14 22 v5 M11.5 24.5 h5"><Pulse values="0.2;1;0.2" dur="2.2s" /></path>
        <path d="M51 32 v5 M48.5 34.5 h5"><Pulse values="0.2;1;0.2" dur="2.2s" begin="0.7s" /></path>
        <path d="M16 40 v4 M14 42 h4"><Pulse values="0.2;1;0.2" dur="2.2s" begin="1.4s" /></path>
      </g>
    </svg>
  )
}

function Nirmaan() {
  return (
    <svg {...svgProps}>
      <Halo />
      <path d="M14 50 h36" opacity="0.85" {...drawProps(36)}>
        <DrawAnim len={36} dur="0.6s" />
      </path>
      <path d="M20 50 v-10" {...drawProps(10)}>
        <DrawAnim len={10} dur="0.5s" begin="0.3s" />
        <Pulse values="0.6;1;0.6" dur="2.2s" begin="1s" />
      </path>
      <path d="M32 50 v-20" {...drawProps(20)}>
        <DrawAnim len={20} dur="0.6s" begin="0.5s" />
        <Pulse values="0.6;1;0.6" dur="2.2s" begin="1.25s" />
      </path>
      <path d="M44 50 v-30" {...drawProps(30)}>
        <DrawAnim len={30} dur="0.7s" begin="0.7s" />
        <Pulse values="0.6;1;0.6" dur="2.2s" begin="1.5s" />
      </path>
      <path d="M38 20 l6 -6 l6 6" opacity="0.9" {...drawProps(18)}>
        <DrawAnim len={18} dur="0.5s" begin="1.1s" />
      </path>
    </svg>
  )
}

function Psychometric() {
  return (
    <svg {...svgProps}>
      <Halo />
      <circle cx="32" cy="32" r="20" opacity="0.85" {...drawProps(126)}>
        <DrawAnim len={126} dur="1.3s" />
      </circle>
      <g>
        <Spin values="-16 32 32;16 32 32;-16 32 32" dur="3.4s" />
        <path d="M32 32 l6.5 -16 l-6.5 5 l-6.5 -5 z" fill="currentColor" fillOpacity="0.2" />
      </g>
      <circle cx="32" cy="32" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

const VARIANTS = {
  'bulls-eye': BullsEye,
  bloom: Bloom,
  breakthrough: Breakthrough,
  nirmaan: Nirmaan,
  'psychometric-testing': Psychometric,
  psychometric: Psychometric,
}

export default function ProgramEmblem({ variant }) {
  const Emblem = VARIANTS[variant]
  return Emblem ? <Emblem /> : null
}
