import { Link } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
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
        title="Compare Our Programs"
        subtitle="What each program covers, side by side, so you can see exactly where they differ."
      >
        {/* <Link to="/services" className="btn btn-secondary btn-large">All services</Link> */}
      </PageHero>

      <section className="section">
        <div className="container">
          <div className="cmp-wrap">
            <table className="cmp-table">
              <caption className="cmp-caption">
                <span className={`text-green-600 font-semibold`}>✓</span> means the program includes it
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="cmp-corner">Program</th>
                  {PROGRAMS.map((p) => (
                    <th scope="col" key={p.slug}>
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
                  <th scope="row" colSpan={PROGRAMS.length + 1}>What’s included</th>
                </tr>

                {CAPABILITIES.map((c) => (
                  <tr key={c.label}>
                    <th scope="row">{c.label}</th>
                    {c.has.map((yes, i) => (
                      <td key={i} className={`!text-center ${yes ? 'cmp-yes' : 'cmp-no'}`}>
                        <span aria-hidden className={`${yes ? "text-green-600" : ""} font-semibold`}>{yes ? '✓' : '—'}</span>
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
                        {p.expertCall ? 'Talk to an expert' : `Book Now`}&nbsp;&nbsp;<ArrowRight className="size-4" />
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
