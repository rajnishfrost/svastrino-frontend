import { Compass, MessageSquare, ClipboardCheck, Rocket, Trophy, Flag } from 'lucide-react'
import './ProgramJourney.css'

/**
 * Programme page · the journey, stage by stage — styled to match the home page's
 * "Your Journey" (white cards on a gradient road with icon-badge nodes), but as
 * a vertical serpentine that scales to any number of stages. The inclusions box
 * sits at the foot so the commitment is clear once the journey is understood.
 */

// Milestone icons + node gradients cycle across however many stages a programme
// has (stages carry no icon of their own — these are decorative markers).
const STAGE_ICONS = [Compass, MessageSquare, ClipboardCheck, Rocket, Trophy, Flag]
const STAGE_GRADS = [
  ['#c8102e', '#a30c25'],
  ['#2f7ae5', '#1c5fc4'],
  ['#0f2c5c', '#0a1f43'],
]

export default function ProgramJourney({ program }) {
  const stages = program.journey || []
  if (!stages.length) return null

  return (
    <div>
      <div className="text-center">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-brand-navy">Program journey</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-brand-slate">
          What actually happens, stage by stage — from the moment you book to the follow-up after the
          last session.
        </p>
      </div>

      <div className="pj-road">
        {stages.map((s, i) => {
          const Icon = STAGE_ICONS[i % STAGE_ICONS.length]
          const grad = STAGE_GRADS[i % STAGE_GRADS.length]
          const side = i % 2 === 0 ? 'pj-step--left' : 'pj-step--right'
          return (
            <div key={i} className={`pj-step ${side}`}>
              <span
                className="pj-badge"
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`,
                  border: '3px solid #fff',
                  boxShadow: '0 8px 18px -6px rgba(15, 44, 92, 0.5)',
                }}
              >
                <Icon size={20} color="#ffffff" strokeWidth={2.2} />
              </span>
              <div className="pj-card">
                {s.label && <div className="pj-label">{s.label}</div>}
                <div className="pj-title">{s.title}</div>
                {s.description && <p className="pj-desc">{s.description}</p>}
              </div>
            </div>
          )
        })}
      </div>

      {/* What the programme includes */}
      <div className="mt-8 rounded-2xl border border-brand-navy/10 bg-brand-cream p-5">
        <h3 className="font-display text-base font-bold text-brand-navy">What the programme includes</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {program.duration && (
            <li className="flex justify-between gap-3"><strong className="font-semibold text-brand-navy">Total duration</strong><span className="text-brand-slate">{program.duration}</span></li>
          )}
          {program.sessions && (
            <li className="flex justify-between gap-3"><strong className="font-semibold text-brand-navy">Sessions</strong><span className="text-brand-slate">{program.sessions}</span></li>
          )}
          {program.mode && (
            <li className="flex justify-between gap-3"><strong className="font-semibold text-brand-navy">Delivered</strong><span className="text-brand-slate">{program.mode}</span></li>
          )}
        </ul>
        {program.brochureUrl && (
          <a
            href={program.brochureUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-brand-navy/15 bg-white px-5 text-sm font-semibold text-brand-navy transition-colors hover:text-brand-crimson"
          >
            Download brochure (PDF)
          </a>
        )}
      </div>
    </div>
  )
}
