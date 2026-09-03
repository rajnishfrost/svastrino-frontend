import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ConnectionState from '../../../common_component/user/ConnectionState/ConnectionState.jsx'
import { useSeo, excerptFor } from '../../../seo/useSeo.js'
import { seoFor } from '../../../seo/legacySeo.js'
import { fetchProgram } from '../../../api/content.js'
import ProgramOverview from './sections/ProgramOverview.jsx'
import ChooseIf from './sections/ChooseIf.jsx'
import ProgramJourney from './sections/ProgramJourney.jsx'
import Benefits from './sections/Benefits.jsx'
import BookNowStrip from './sections/BookNowStrip.jsx'
import ProgramTestimonials from './sections/ProgramTestimonials.jsx'
import ProgramFaqs from './sections/ProgramFaqs.jsx'
import ProgramHeroArt from './sections/ProgramHeroArt.jsx'
import TalkToExpert from './sections/TalkToExpert.jsx'
import './Services.css' // keeps .svc-hero-trust (hero) styled; body sections use Tailwind

// Themed hero background per program (optimised from the brand imagery).
const HERO_IMG = {
  'bulls-eye': '/assets/images/programs/bulls-eye.jpg',
  bloom: '/assets/images/programs/bloom.jpg',
  breakthrough: '/assets/images/programs/breakthrough.jpg',
}

// Flat vector illustration per program. Where a slug has one, the hero switches
// to the light split illustration layout instead of the photo background.
const HERO_ILLUS = {
  'bulls-eye': '/assets/images/programs/bullsEye-t.png',
  bloom: '/assets/images/programs/bloom-3-t.png',
  breakthrough: '/assets/images/programs/break-6-t.png',
}

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

  // Each program page keeps the title and description its old address ranked
  // with; a program added since then falls back to its own summary.
  const legacy = seoFor(`/services/${slug}`)
  useSeo({
    ready: !!program,
    title: legacy?.title || program?.name,
    description: legacy?.description || excerptFor(program?.summary),
    path: `/services/${slug}`,
    exact: !!legacy?.title,
  })

  // Breakthrough is not sold from a checkout page — the visitor asks for a call
  // and the team sends a payment link afterwards. Every CTA on the page points
  // at the call-back form instead of the booking wizard.
  const expertCall = program?.buyMode === 'expert-call'
  const ctaLabel = expertCall ? 'Talk to an expert' : 'Book now'

  const trustLine = program?.trustLine || (expertCall
    ? 'Guided one to one by Svastrino mentors · no payment before you speak to us'
    : 'Guided one to one by Svastrino mentors')

  /**
   * The main call to action. For a self-serve program it navigates to the
   * booking wizard; for an expert-call program it only scrolls down the page,
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
        <section className="py-16"><div className="container">
          <ConnectionState error={error} onRetry={() => setReloadKey((k) => k + 1)} label="this program" />
        </div></section>
      </>
    )
  }

  if (!program) {
    return (
      <>
        <PageHero eyebrow="Services" title="Loading…" />
        <section className="py-16"><div className="container"><p className="text-center text-brand-slate">Loading…</p></div></section>
      </>
    )
  }

  return (
    <>
      <PageHero
        eyebrow={program.category?.name || 'Services'}
        title={program.name}
        subtitle={program.tagline}
        bgImage={HERO_IMG[slug]}
        illustration={HERO_ILLUS[slug] ? <ProgramHeroArt src={HERO_ILLUS[slug]} /> : null}
      >
        <Cta className="btn btn-accent btn-large" />
        <Link to="/services" className="btn btn-secondary btn-large">All services</Link>
        {/* The trust line the visitor needs before reading anything else. */}
        <p className="svc-hero-trust">{trustLine}</p>
      </PageHero>

      <section className="bg-white py-16">
        <div className="container mx-auto max-w-4xl space-y-6">
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
          <div className="rounded-2xl border border-brand-navy/5 bg-brand-cream p-8 text-center">
            <h2 className="font-display text-2xl font-extrabold text-brand-navy">Ready to begin {program.name}?</h2>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Cta className="btn btn-accent btn-large" />
              <Link to="/services/compare" className="btn btn-secondary btn-large">
                Compare programs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
