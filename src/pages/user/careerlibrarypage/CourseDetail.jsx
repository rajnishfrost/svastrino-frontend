import { useEffect, useState } from 'react'
import { useSeo, excerptFor } from '../../../seo/useSeo.js'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ConnectionState from '../../../common_component/user/ConnectionState/ConnectionState.jsx'
import { fetchCourse } from '../../../api/content.js'

export default function CourseDetail() {
  const { slug } = useParams()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  // Career pages also keep their legacy root address — see RootSlug.
  useSeo({
    ready: !!course,
    title: course?.name,
    description: excerptFor(course?.overview),
    path: course ? `/${course.slug}` : undefined,
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setNotFound(false)
    setCourse(null)

    fetchCourse(slug)
      .then((d) => { if (!cancelled) setCourse(d.course) })
      .catch((err) => {
        if (cancelled) return
        if (err.status === 404) setNotFound(true)
        else setError(err)
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [slug, reloadKey])

  const retry = () => setReloadKey((k) => k + 1)

  if (loading) {
    return (
      <section className="py-20">
        <div className="container"><p className="text-center text-brand-slate">Loading course…</p></div>
      </section>
    )
  }

  if (notFound) {
    return (
      <section className="py-24">
        <div className="container mx-auto max-w-xl text-center">
          <h1 className="font-display text-3xl font-extrabold text-brand-navy">Course not found</h1>
          <p className="mt-3 text-brand-slate">That course may have been moved or removed.</p>
          <Link
            to="/resources#career-library"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand-crimson px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-crimson-dark"
          >
            Back to Career Library
          </Link>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-20">
        <div className="container">
          <ConnectionState error={error} onRetry={retry} label="this course" />
          <p className="mt-6 text-center">
            <Link
              to="/resources#career-library"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-brand-navy/15 bg-white px-6 text-sm font-semibold text-brand-navy transition-colors hover:text-brand-crimson"
            >
              Back to Career Library
            </Link>
          </p>
        </div>
      </section>
    )
  }

  const hasInstitutes = course.institutesIndia.length > 0 || course.institutesInternational.length > 0

  return (
    <>
      <PageHero eyebrow="Career Library" title={course.name} subtitle={course.overview} />

      <section className="bg-white py-16 md:py-20">
        <div className="container mx-auto max-w-4xl">
          <Link to="/resources#career-library" className="text-sm font-semibold text-brand-crimson hover:underline">
            ← All career streams
          </Link>

          {course.fields.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-brand-navy">Streams:</span>
              {course.fields.map((f) => (
                <span
                  key={f.slug}
                  className="rounded-full bg-brand-crimson/10 px-3 py-0.5 text-xs font-semibold text-brand-crimson"
                >
                  {f.name}
                </span>
              ))}
            </div>
          )}

          {/* Top qualities */}
          {course.topQualities.length > 0 && (
            <section className="mt-10">
              <h2 className="border-b border-brand-navy/10 pb-2 font-display text-2xl font-bold text-brand-navy">
                Qualities you'll need
              </h2>
              <ul className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                {course.topQualities.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-brand-navy">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-crimson" />
                    {q}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Jobs + salary */}
          {course.topJobs.length > 0 && (
            <section className="mt-10">
              <h2 className="border-b border-brand-navy/10 pb-2 font-display text-2xl font-bold text-brand-navy">
                Careers &amp; salaries
              </h2>
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                {course.topJobs.map((j, i) => (
                  <article key={i} className="rounded-xl border border-brand-navy/5 bg-white p-6 shadow-sm">
                    <h3 className="font-display text-lg font-bold text-brand-navy">{j.role}</h3>
                    {j.description && <p className="mt-2 text-sm leading-relaxed text-brand-slate">{j.description}</p>}
                    {(j.indiaSalary || j.globalSalary) && (
                      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-brand-navy/10 pt-4">
                        {j.indiaSalary && (
                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-brand-slate">India</dt>
                            <dd className="font-display text-base font-bold text-brand-navy">{j.indiaSalary}</dd>
                          </div>
                        )}
                        {j.globalSalary && (
                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-brand-slate">Global</dt>
                            <dd className="font-display text-base font-bold text-brand-navy">{j.globalSalary}</dd>
                          </div>
                        )}
                      </dl>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Institutes */}
          {hasInstitutes && (
            <section className="mt-10">
              <h2 className="border-b border-brand-navy/10 pb-2 font-display text-2xl font-bold text-brand-navy">
                Top institutes
              </h2>
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                {course.institutesIndia.length > 0 && (
                  <div className="rounded-xl border border-brand-navy/5 bg-white p-6 shadow-sm">
                    <h3 className="font-display text-lg font-bold text-brand-navy">India</h3>
                    <ul className="mt-3 space-y-1.5 text-sm text-brand-slate">
                      {course.institutesIndia.map((n, i) => <li key={i}>{n}</li>)}
                    </ul>
                  </div>
                )}
                {course.institutesInternational.length > 0 && (
                  <div className="rounded-xl border border-brand-navy/5 bg-white p-6 shadow-sm">
                    <h3 className="font-display text-lg font-bold text-brand-navy">International</h3>
                    <ul className="mt-3 space-y-1.5 text-sm text-brand-slate">
                      {course.institutesInternational.map((n, i) => <li key={i}>{n}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Career ladder */}
          {course.careerLadder.length > 0 && (
            <section className="mt-10">
              <h2 className="border-b border-brand-navy/10 pb-2 font-display text-2xl font-bold text-brand-navy">
                Career ladder
              </h2>
              <ol className="mt-5 divide-y divide-brand-navy/10">
                {course.careerLadder.map((step, i) => (
                  <li key={i} className="flex items-start gap-4 py-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-crimson font-display text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="pt-1 text-sm text-brand-navy">{step}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* CTA */}
          <div className="mt-12 rounded-2xl border border-brand-navy/5 bg-brand-cream p-8 text-center">
            <h3 className="font-display text-2xl font-extrabold text-brand-navy">
              Is this the right path for you?
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-brand-slate">
              A mentoring session helps you match your strengths and interests to a course like this — before you commit.
            </p>
            <Link
              to="/book-online"
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-crimson px-8 text-base font-semibold text-white transition-colors hover:bg-brand-crimson-dark"
            >
              Book a session <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
