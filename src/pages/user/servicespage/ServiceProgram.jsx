import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ConnectionState from '../../../common_component/user/ConnectionState/ConnectionState.jsx'
import { fetchProgram } from '../../../api/content.js'
import ProgramOverview from './sections/ProgramOverview.jsx'
import ChooseIf from './sections/ChooseIf.jsx'
import ProgramJourney from './sections/ProgramJourney.jsx'
import Benefits from './sections/Benefits.jsx'
import BookNowStrip from './sections/BookNowStrip.jsx'
import ProgramTestimonials from './sections/ProgramTestimonials.jsx'
import ProgramFaqs from './sections/ProgramFaqs.jsx'
import TalkToExpert from './sections/TalkToExpert.jsx'
import './Services.css'

/**
 * A single program's own page (Bull's Eye / Bloom / Breakthrough). Pulls the
 * marketing detail from the content module and offers a "Book now" CTA that
 * opens the booking wizard pre-selected to this program's SKU.
 *
 * The page reads top to bottom as a decision: what it is → is it for me → what
 * happens → what I get → book → who else did it → what I'm still unsure about.
 */
export default function ServiceProgram() {
  const { slug } = useParams()
  const [program, setProgram] = useState(null)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setProgram(null); setError(null)
    fetchProgram(slug)
      .then((d) => { if (!cancelled) setProgram(d.program) })
      .catch((err) => { if (!cancelled) setError(err) })
    return () => { cancelled = true }
  }, [slug, reloadKey])

  const bookHref = program?.bookingSku ? `/book-online?program=${program.bookingSku}` : '/book-online'

  // Breakthrough is not sold from a checkout page — the visitor asks for a call
  // and the team sends a payment link afterwards. Every CTA on the page points
  // at the call-back form instead of the booking wizard.
  const expertCall = program?.buyMode === 'expert-call'
  const ctaLabel = expertCall ? 'Talk to an expert' : 'Book now'

  // Each programme is trusted for a different reason and by a different number
  // of people, so the proof line belongs to the programme record rather than to
  // this page. Until every programme carries its own `trustLine` we fall back to
  // a claim that is true of all of them: no head-count, because the counts
  // differ per programme (and the home page already publishes the real figures).
  const trustLine = program?.trustLine || (expertCall
    ? 'Guided one to one by Svastrino mentors · no payment before you speak to us'
    : 'Guided one to one by Svastrino mentors')

  /**
   * The main call to action. For a self-serve programme it navigates to the
   * booking wizard; for an expert-call programme it only scrolls down the page,
   * which is a plain anchor rather than a route change.
   */
  function Cta({ className }) {
    return expertCall
      ? <a href="#talk-to-an-expert" className={className}>{ctaLabel}</a>
      : <Link to={bookHref} className={className}>{ctaLabel}</Link>
  }

  if (error) {
    return (
      <>
        <PageHero eyebrow="Services" title="Program" />
        <section className="section"><div className="container">
          <ConnectionState error={error} onRetry={() => setReloadKey((k) => k + 1)} label="this program" />
        </div></section>
      </>
    )
  }

  if (!program) {
    return (
      <>
        <PageHero eyebrow="Services" title="Loading…" />
        <section className="section"><div className="container"><p className="svc-state">Loading…</p></div></section>
      </>
    )
  }

  return (
    <>
      <PageHero
        eyebrow={program.category?.name || 'Services'}
        title={program.name}
        subtitle={program.tagline}
      >
        <Cta className="btn btn-accent btn-large" />
        <Link to="/services" className="btn btn-secondary btn-large">All services</Link>
        {/* The trust line the visitor needs before reading anything else. */}
        <p className="svc-hero-trust">{trustLine}</p>
      </PageHero>

      <section className="section">
        <div className="container svc-detail-wrap">
          <ProgramOverview program={program} />
          <ChooseIf items={program.chooseIf} />
          <ProgramJourney program={program} />
          <Benefits items={program.benefits} programName={program.name} />
          {expertCall
            ? <TalkToExpert program={program} />
            : <BookNowStrip program={program} bookHref={bookHref} />}
          <ProgramTestimonials slug={program.slug} programName={program.name} />
          <ProgramFaqs faqs={program.faqs} />

          {/* Closing CTA — for anyone who read all the way down. */}
          <div className="card svc-panel svc-cta">
            <h2 className="svc-h2">Ready to begin {program.name}?</h2>
            <div className="svc-actions">
              <Cta className="btn btn-primary btn-large" />
              <Link to="/services/compare" className="btn btn-secondary btn-large">
                Compare programs
              </Link>
              {program.brochureUrl && (
                <a className="btn btn-secondary btn-large" href={program.brochureUrl} target="_blank" rel="noopener noreferrer">
                  Download brochure (PDF)
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
