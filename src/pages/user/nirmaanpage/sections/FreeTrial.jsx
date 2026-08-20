import { Link } from 'react-router-dom'
import { useAuth } from '../../../../context/AuthContext.jsx'

/**
 * Nirmaan · the 1-week free trial — the step between watching a preview and
 * paying. A signed-out visitor registers first; a signed-in one starts it.
 */
export default function FreeTrial() {
  const { user } = useAuth()

  return (
    <section id="free-trial" className="section">
      <div className="container">
        <div className="card nirmaan-trial">
          <h2 className="nirmaan-trial-title">Liked the Glimpse but Still Unsure?</h2>
          <p className="nirmaan-trial-sub">
            Start your 1-week free trial and experience the journey for yourself — the
            real videos, the real daily tasks, and the actual feel of the course.
          </p>
          <Link
            to={user ? '/checkout?pkg=nirmaan-payu&trial=1' : '/login?mode=signup'}
            className="btn btn-primary btn-large"
          >
            Register for 1 week Free Trial
          </Link>
          {!user && (
            <p className="nirmaan-trial-note">
              You’ll create your account first — the trial starts straight after.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
