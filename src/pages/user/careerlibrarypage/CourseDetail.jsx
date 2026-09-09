import { useEffect, useState } from 'react'
import { excerptFor } from '../../../seo/useSeo.js'
import { useRootSeo } from '../../../seo/PageSeo.jsx'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ConnectionState from '../../../common_component/user/ConnectionState/ConnectionState.jsx'
import { fetchCourse } from '../../../api/content.js'
import RichText from '../../../common_component/user/RichText/RichText.jsx'

export default function CourseDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  // Career pages also keep their legacy root address — see RootSlug.
  useRootSeo({
    slug,
    canonicalSlug: course?.canonicalSlug,
    seoTitle: course?.seoTitle,
    seoDescription: course?.seoDescription,
    ready: !!course,
    title: course?.name,
    description: excerptFor(course?.overview),
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

  // Step back through the visitor's own history; fall back to the library when
  // they landed here straight from a search result or a shared link.
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1)
    else navigate('/resources#career-library')
  }

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

  return (
    <>
      <PageHero eyebrow="Career Library" title={course.name} />

      <section className="bg-white py-16 md:py-20">
        <div className="container mx-auto max-w-4xl">
          <button
            type="button"
            onClick={goBack}
            className="cursor-pointer border-0 bg-transparent p-0 font-sans text-sm font-semibold text-brand-crimson hover:underline"
          >
            ← All career streams
          </button>

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

          {/* The page itself — whatever an admin wrote, in the order they
              wrote it. It used to be four fixed sections built from separate
              fields; those were folded into this document by
              migrateCourseSections.js on the server. */}
          <RichText blocks={course.overviewBlocks} className="mt-8" />

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
