import { useEffect, useState } from 'react'
import { api, tokenStore } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * The signed-in student's standing with Nirmaan, for the calls to action that
 * sit outside the Nirmaan page's own trial section (which reads the same thing).
 *
 *   undefined  still looking — keep the buttons out of sight until it lands,
 *              so a paying student never sees "Start your free trial" flash
 *   null       signed out
 *   'none'     nothing yet
 *   'trial'    a live free week
 *   'owned'    bought it
 *   'used'     their trial ran out and they never bought
 *   'expired'  a purchase whose year is over
 *
 * The states are the server's (learn/trial.js nirmaanStanding).
 */
export function useNirmaanStanding() {
  const { user } = useAuth()
  const [standing, setStanding] = useState(() => (tokenStore.get() ? undefined : null))

  useEffect(() => {
    if (!tokenStore.get()) { setStanding(null); return undefined }
    if (!user) return undefined
    let live = true
    api('/user/learn/trial', { auth: 'user' })
      .then((d) => { if (live) setStanding(d?.state || 'none') })
      .catch(() => { if (live) setStanding('none') })
    return () => { live = false }
  }, [user])

  return standing
}
