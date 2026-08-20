import { Link } from 'react-router-dom'

/**
 * Programme page · a conversion band placed mid-page, once the visitor has
 * read the journey and the benefits but before the questions. Someone who is
 * already convinced should not have to scroll to the bottom to act.
 */
export default function BookNowStrip({ program, bookHref }) {
  return (
    <section className="svc-book-strip">
      <div>
        <h2>Ready to begin {program.name}?</h2>
        <p>
          {program.duration && <>{program.duration} · </>}
          {program.mode || 'Online'} · guided one to one
        </p>
      </div>
      <Link to={bookHref} className="btn btn-accent btn-large">Book now</Link>
    </section>
  )
}
