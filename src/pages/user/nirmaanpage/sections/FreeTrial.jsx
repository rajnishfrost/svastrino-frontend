import { Link } from 'react-router-dom'
import { useAuth } from '../../../../context/AuthContext.jsx'

/**
 * Nirmaan · the 1-week free trial — the step between watching a preview and
 * paying. A signed-out visitor registers first; a signed-in one starts it.
 */
export default function FreeTrial() {
  const { user } = useAuth()

  return (
    <section id="free-trial" className="bg-nirmaan-cream/50 py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl rounded-2xl border border-nirmaan-sand bg-white p-8 text-center shadow-sm md:p-10">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown">
            Liked the Glimpse but Still Unsure?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-nirmaan-brown-soft">
            Start your 1-week free trial and experience the journey for yourself — the real videos,
            the real daily tasks, and the actual feel of the course.
          </p>
          <Link
            to={user ? '/checkout?pkg=nirmaan-payu&trial=1' : '/login?mode=signup'}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-nirmaan-green px-8 text-base font-semibold text-white shadow-sm transition-colors hover:bg-nirmaan-green-dark"
          >
            Register for 1 week Free Trial
          </Link>
          {!user && (
            <p className="mt-3 text-sm text-nirmaan-brown-soft">
              You’ll create your account first — the trial starts straight after.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
