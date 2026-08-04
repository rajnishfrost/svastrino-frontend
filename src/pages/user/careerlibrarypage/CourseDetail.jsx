import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ConnectionState from '../../../common_component/user/ConnectionState/ConnectionState.jsx'
import { fetchCourse } from '../../../api/content.js'
import './CourseDetail.css'

export default function CourseDetail() {
  const { slug } = useParams()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

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
      <section className="section">
        <div className="container"><p className="course-state">Loading course…</p></div>
      </section>
    )
  }

  if (notFound) {
    return (
      <section className="section">
        <div className="container course-missing">
          <h1>Course not found</h1>
          <p>That course may have been moved or removed.</p>
          <Link to="/resources#career-library" className="btn btn-primary">Back to Career Library</Link>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="section">
        <div className="container">
          <ConnectionState error={error} onRetry={retry} label="this course" />
          <p style={{ textAlign: 'center' }}>
            <Link to="/resources#career-library" className="btn btn-secondary">Back to Career Library</Link>
          </p>
        </div>
      </section>
    )
  }

  const hasInstitutes = course.institutesIndia.length > 0 || course.institutesInternational.length > 0

  return (
    <>
      <PageHero eyebrow="Career Library" title={course.name} subtitle={course.overview} />

      <section className="section">
        <div className="container course-body">
          <Link to="/resources#career-library" className="course-back">← All career streams</Link>

          {course.fields.length > 0 && (
            <div className="course-fields">
              <span className="course-fields-label">Streams:</span>
              {course.fields.map((f) => (
                <span key={f.slug} className="course-field-chip">{f.name}</span>
              ))}
            </div>
          )}

          {/* Top qualities */}
          {course.topQualities.length > 0 && (
            <section className="course-block">
              <h2>Qualities you'll need</h2>
              <ul className="course-qualities">
                {course.topQualities.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </section>
          )}

          {/* Jobs + salary */}
          {course.topJobs.length > 0 && (
            <section className="course-block">
              <h2>Careers &amp; salaries</h2>
              <div className="course-jobs">
                {course.topJobs.map((j, i) => (
                  <article key={i} className="card course-job">
                    <h3>{j.role}</h3>
                    {j.description && <p>{j.description}</p>}
                    {(j.indiaSalary || j.globalSalary) && (
                      <dl className="course-salary">
                        {j.indiaSalary && (
                          <div><dt>India</dt><dd>{j.indiaSalary}</dd></div>
                        )}
                        {j.globalSalary && (
                          <div><dt>Global</dt><dd>{j.globalSalary}</dd></div>
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
            <section className="course-block">
              <h2>Top institutes</h2>
              <div className="grid grid-2">
                {course.institutesIndia.length > 0 && (
                  <div className="card course-institutes">
                    <h3>India</h3>
                    <ul>{course.institutesIndia.map((n, i) => <li key={i}>{n}</li>)}</ul>
                  </div>
                )}
                {course.institutesInternational.length > 0 && (
                  <div className="card course-institutes">
                    <h3>International</h3>
                    <ul>{course.institutesInternational.map((n, i) => <li key={i}>{n}</li>)}</ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Career ladder */}
          {course.careerLadder.length > 0 && (
            <section className="course-block">
              <h2>Career ladder</h2>
              <ol className="course-ladder">
                {course.careerLadder.map((step, i) => (
                  <li key={i}><span className="course-ladder-num">{i + 1}</span><p>{step}</p></li>
                ))}
              </ol>
            </section>
          )}

          {/* CTA */}
          <div className="course-cta card">
            <h3>Is this the right path for you?</h3>
            <p>
              A mentoring session helps you match your strengths and interests to a course like this
              — before you commit.
            </p>
            <Link to="/book-online" className="btn btn-accent">Book a session</Link>
          </div>
        </div>
      </section>
    </>
  )
}
