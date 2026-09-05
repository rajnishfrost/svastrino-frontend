/**
 * Which dashboard tab a purchase should land on.
 *
 * Landing everyone on the same tab makes the page answer a question nobody
 * asked: buy a mentoring program and you were shown your courses, buy a course
 * and you were shown the same thing by luck rather than design. What someone
 * just paid for is the one thing they want to see, so the SKU decides.
 *
 * Keyed on the SKU's own prefix, which is how the catalogue already separates
 * the two families (`mentoring-…` against `nirmaan-…`). Anything unrecognised
 * falls back to the dashboard's own default rather than guessing.
 */
export function dashboardTabFor(sku) {
  const s = String(sku || '')
  if (s.startsWith('mentoring-')) return '/dashboard/services'
  if (s.startsWith('nirmaan-')) return '/dashboard/skill-build'
  return '/dashboard'
}
