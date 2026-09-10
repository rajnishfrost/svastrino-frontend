import { GraduationCap, Rocket, Briefcase, Lightbulb, TrendingUp } from 'lucide-react'
import './ProgramHeroArt.css'

/**
 * Program-hero visual: the flat illustration for a program, framed by a few
 * gently-floating "career" icon bubbles so the hero reads as a designed scene
 * rather than a plain image on the right. Bubbles are styled inline (geometry)
 * + lucide size/color props — reliable against the global reset and old lucide.
 */
const BUBBLES = [
  { Icon: GraduationCap, color: '#c8102e', size: 60, pos: { top: '1%', left: '-1%' }, delay: '0s' },
  { Icon: Rocket, color: '#2f7ae5', size: 50, pos: { top: '7%', right: '4%' }, delay: '.9s' },
  { Icon: Briefcase, color: '#0f2c5c', size: 56, pos: { top: '47%', right: '-3%' }, delay: '1.5s' },
  { Icon: Lightbulb, color: '#c8102e', size: 46, pos: { bottom: '15%', left: '-3%' }, delay: '.4s' },
  { Icon: TrendingUp, color: '#2f7ae5', size: 52, pos: { bottom: '2%', right: '18%' }, delay: '1.2s' },
]

export default function ProgramHeroArt({ src, alt = '' }) {
  if (!src) return null
  // JPGs have a baked-in white background → multiply it out; transparent PNG/SVG
  // already blend, so leave them as-is (multiply would only darken them).
  const blend = /\.jpe?g$/i.test(src)
  return (
    <div className="hero-art">
      <img
        className="hero-art-img max-h-[425px] w-auto"
        src={src}
        alt={alt}
        loading="eager"
        // style={blend ? { mixBlendMode: 'multiply' } : undefined}
      />
      {BUBBLES.map((b, i) => {
        const { Icon } = b
        return (
          <span
            key={i}
            className="hero-bubble"
            style={{ ...b.pos, width: b.size, height: b.size, animationDelay: b.delay }}
          >
            <Icon size={Math.round(b.size * 0.42)} color={b.color} strokeWidth={2.1} />
          </span>
        )
      })}
    </div>
  )
}
