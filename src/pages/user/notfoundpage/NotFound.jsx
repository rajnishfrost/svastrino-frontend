import { Link } from 'react-router-dom'
import './NotFound.css'

export default function NotFound() {
  return (
    <section className="notfound">
      <div className="container">
        <p className="notfound-code">404</p>
        <h1>Page not found</h1>
        <p className="notfound-sub">The page you’re looking for doesn’t exist or has moved.</p>
        <Link to="/" className="btn btn-primary">Back to home</Link>
      </div>
    </section>
  )
}
