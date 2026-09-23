import { useCallback, useEffect, useState } from 'react'
import { api, tokenStore } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * The signed-in student's standing with a course's psychometric test, so a page
 * can stop selling the test to someone who already has it.
 *
 *   undefined  still looking — render nothing that could flash a buy button
 *              at someone who owns the test
 *   'guest'    signed out
 *   'none'     not enrolled in the course
 *   'no-test'  enrolled on a plan without the test; an upgrade adds it
 *   'owned'    the test is theirs; `assessment` carries its status and report
 *
 * Read from GET /user/assessment/:product, which answers the two "not yours"
 * cases with a 403 and a code (NOT_ENROLLED / NOT_INCLUDED).
 */
export function usePsychometric(product = 'nirmaan') {
  const { user } = useAuth()
  const [state, setState] = useState(() => (tokenStore.get() ? undefined : 'guest'))
  const [assessment, setAssessment] = useState(null)

  const reload = useCallback(async () => {
    if (!tokenStore.get()) { setState('guest'); setAssessment(null); return null }
    try {
      const a = await api(`/user/assessment/${product}`, { auth: 'user' })
      setAssessment(a); setState('owned')
      return a
    } catch (e) {
      // Anything but "your plan lacks the test" reads as not enrolled: a page
      // that errs toward its public version shows an owner a buy button at
      // worst, never a test they cannot open.
      setAssessment(null); setState(e.code === 'NOT_INCLUDED' ? 'no-test' : 'none')
      return null
    }
  }, [product])

  useEffect(() => {
    if (!tokenStore.get()) { setState('guest'); setAssessment(null); return }
    if (!user) return // the profile is still loading; this runs again with it
    reload()
  }, [user, reload])

  return { state, assessment, setAssessment, reload }
}
