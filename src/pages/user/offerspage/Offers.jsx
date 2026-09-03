import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ConnectionState from '../../../common_component/user/ConnectionState/ConnectionState.jsx'
import { fetchOffers } from '../../../api/notifications.js'
import './Offers.css'
import { usePageSeo } from '../../../seo/PageSeo.jsx'

/**
 * "New offers" — the discounts, new batches and scholarship windows the team
 * has running right now.
 *
 * Public on purpose: an offer only works if somebody who has not signed up yet
 * can read it. The server decides what a signed-out visitor is allowed to see,
 * so this page just renders whatever comes back.
 */
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

export default function Offers() {
  usePageSeo({
    title: 'Offers — what is running right now',
    description: 'Current offers on Svastrino mentoring programs and the Nirmaan course.',
  })
  const [offers, setOffers] = useState(null)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setOffers(null); setError(null)
    fetchOffers()
      .then((d) => { if (!cancelled) setOffers(d.offers || []) })
      .catch((err) => { if (!cancelled) setError(err) })
    return () => { cancelled = true }
  }, [reloadKey])

  return (
    <>
      <PageHero
        eyebrow="Offers"
        title="New offers"
        subtitle="Everything we have running at the moment — discounts, new batches and scholarship windows, in one place."
      />

      <section className="section">
        <div className="container">
          {error ? (
            <ConnectionState
              error={error}
              onRetry={() => setReloadKey((k) => k + 1)}
              label="our current offers"
            />
          ) : !offers ? (
            <p className="off-state">Loading…</p>
          ) : offers.length === 0 ? (
            <EmptyOffers />
          ) : (
            <div className="grid off-grid">
              {offers.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function OfferCard({ offer }) {
  return (
    <article className="card off-card">
      {offer.image && (
        <img className="off-image" src={offer.image} alt="" loading="lazy" />
      )}

      <h2 className="off-title">{offer.title}</h2>
      {offer.body && <p className="off-body">{offer.body}</p>}

      {offer.code && <CouponCode code={offer.code} />}

      {offer.endsAt && (
        <p className="off-ends">Ends on {fmtDate(offer.endsAt)}</p>
      )}

      {offer.link && <OfferCta link={offer.link} />}
    </article>
  )
}

/**
 * The offer's own call to action. An offer can point at a page on this site or
 * at something we run elsewhere, so an in-app path routes without a reload and
 * anything else is left to the browser.
 */
function OfferCta({ link }) {
  const external = /^https?:\/\//i.test(link)
  if (external) {
    return (
      <a className="btn btn-primary off-cta" href={link} target="_blank" rel="noreferrer">
        View offer
      </a>
    )
  }
  return <Link className="btn btn-primary off-cta" to={link}>View offer</Link>
}

/**
 * The coupon code with a copy button that confirms in place. A toast at the
 * other end of the screen would be missed — the student is looking at the code
 * they just tapped.
 */
function CouponCode({ code }) {
  const [copied, setCopied] = useState(false)

  // The confirmation clears itself, so the button never sits on "Copied" long
  // after the fact and leaves the student wondering if it worked twice.
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      // Clipboard access is refused on insecure origins and inside some in-app
      // browsers. The code is printed right there either way, so there is
      // nothing to rescue — they can select it by hand.
    }
  }

  return (
    <div className="off-code">
      <code className="off-code-value">{code}</code>
      <button type="button" className="off-code-btn" onClick={copy}>
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

function EmptyOffers() {
  return (
    <div className="card off-empty">
      <h2 className="off-empty-title">No offers running right now</h2>
      <p className="off-empty-text">
        We only list an offer while it is genuinely live, and there is nothing on today.
        Our programs and the Nirmaan course are open in the meantime — this page is the
        first place a new offer appears.
      </p>
      <div className="off-empty-actions">
        <Link to="/services" className="btn btn-primary">See our services</Link>
        <Link to="/skill-build/nirmaan" className="btn btn-secondary">Explore Nirmaan</Link>
      </div>
    </div>
  )
}
