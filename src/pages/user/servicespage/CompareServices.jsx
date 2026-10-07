import { Link } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ProgramHeroArt from './sections/ProgramHeroArt.jsx'
import { PROGRAMS, DETAILS, CAPABILITIES } from './compareData.js'
import './Compare.css'
import PageSeo from '../../../seo/PageSeo.jsx'
import { ArrowRight } from 'lucide-react'

/**
 * Compare the three counselling and mentoring programs side by side — for the
 * visitor who has narrowed it down but cannot choose.
 *
 * The table is wide, so it scrolls inside its own box rather than pushing the
 * page sideways, and the first column stays put while you scroll across.
 */
export default function CompareServices() {
  return (
    <>
      <PageSeo />
      <PageHero
        eyebrow="Services"
        title="Compare Our Programmes"
        subtitle="What each programme covers, side by side, so you can see exactly where they differ."
        illustration={<ProgramHeroArt src="/assets/images/compare-t.png" alt="" />}
      >
        {/* <Link to="/services" className="btn btn-secondary btn-large">All services</Link> */}
      </PageHero>

      <section className="section">
        <div className="container">
          {/* Phones (portrait): the table is wider than the screen, so it
              scrolls sideways inside its box — feature names stay pinned on
              the left, programme names on top. Landscape fits it whole. */}
          <p className="cmp-hint" aria-hidden>
            Swipe sideways to compare all three <span>→</span>
            <small>or turn your phone for the full table</small>
          </p>
          <div className="cmp-wrap">
            <table className="cmp-table">
              <caption className="cmp-caption">
                <span className={`text-green-600 font-semibold`}>✓</span> means the programme includes it
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="cmp-corner">Programme</th>
                  {PROGRAMS.map((p) => (
                    <th scope="col" key={p.slug} className='!text-center'>
                      <span className="cmp-cat">{p.category}</span>
                      <Link to={`/services/${p.slug}`}>{p.name}</Link>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {DETAILS.map((d) => (
                  <tr key={d.label} className="cmp-detail">
                    <th scope="row">{d.label}</th>
                    {d.values.map((v, i) => <td key={i}>{v}</td>)}
                  </tr>
                ))}

                <tr className="cmp-divider">
                  {/* Colours go on the <th>, not the <tr>: the cell's own
                      background/color (from `.cmp-divider th`) paints over the
                      row's, so styling the row has no visible effect. */}
                  <th scope="row" colSpan={PROGRAMS.length + 1} className="!bg-brand-navy !text-white"><span className="cmp-divider-label">What’s included</span></th>
                </tr>

                {CAPABILITIES.map((c) => (
                  <tr key={c.label}>
                    <th scope="row">{c.label}</th>
                    {c.has.map((yes, i) => (
                      <td key={i} className={`!text-center ${yes ? 'cmp-yes' : 'cmp-no'}`}>
                        <span aria-hidden className={`${yes ? "text-green-600" : "text-brand-crimson"} font-semibold`}>{yes ? '✓' : 'X'}</span>
                        <span className="sr-only">{yes ? 'Included' : 'Not included'}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr>
                  <td />
                  {PROGRAMS.map((p) => (
                    <td key={p.slug}>
                      {/* Breakthrough is sold after a call — its button opens the
                          call-back form on its own page instead of the checkout. */}
                      <Link
                        to={
                          p.expertCall
                            ? `/services/${p.slug}#talk-to-an-expert`
                            : `/book-online?program=mentoring-${p.slug.replace('bulls-eye', 'bullseye')}`
                        }
                        className="btn btn-primary"
                      >
                        {/* {p.expertCall ? 'Talk to an expert' : `Book ${p.name.replace(' Program', '')}`} */}
                        {p.expertCall ? 'Talk to an Expert' : `Book Now`}&nbsp;&nbsp;<ArrowRight className="size-4" />
                      </Link>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="cmp-note">
            Still not sure? A short <Link to="/services/bulls-eye" className={`text-brand-navy font-semibold`}>counselling session</Link> will
            help you pick the right one.
          </p>
        </div>
      </section>
    </>
  )
}
