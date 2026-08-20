import { api } from './client.js'

// The course player (server: /api/user/learn/*). The player itself still calls
// api() inline for its many small writes; this module holds the calls that are
// shared beyond it.

/**
 * Everything the student did in one course — questions, their own answers, and
 * the dates. Stays available for three years after the course year ends, then
 * comes back with `downloadable: false` and no sessions. → the record object
 */
export const fetchCourseRecord = (slug) =>
  api(`/user/learn/${encodeURIComponent(slug)}/record`, { auth: 'user' })
