import { api } from './client.js'

/** Mentoring consultancy programs. → { programs } */
export const fetchPrograms = () => api('/user/content/programs')

/** One program with journey/benefits. → { program } */
export const fetchProgram = (slug) => api(`/user/content/programs/${encodeURIComponent(slug)}`)

/** FAQs grouped into sections. → { faqs: [{ section, items }] } */
export const fetchFaqs = () => api('/user/content/faqs')

/** Success stories. Pass true for the homepage subset. → { testimonials } */
export const fetchTestimonials = (featured = false) =>
  api(`/user/content/testimonials${featured ? '?featured=true' : ''}`)

/** Career library streams + courses. → { fields } */
export const fetchCareerLibrary = () => api('/user/content/career-library')

/** Paginated career-library courses. → { courses, pagination } */
export const fetchCourses = ({ page, limit, field, q } = {}) => {
  const search = new URLSearchParams()
  Object.entries({ page, limit, field, q }).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') search.set(k, v)
  })
  const qs = search.toString()
  return api(`/user/content/courses${qs ? `?${qs}` : ''}`)
}

/** One course detail page. → { course } */
export const fetchCourse = (slug) => api(`/user/content/courses/${encodeURIComponent(slug)}`)

/** One policy/legal page (markdown body). → { page } */
export const fetchSitePage = (slug) => api(`/user/content/pages/${encodeURIComponent(slug)}`)

/** The Services catalogue, grouped by sub-category — one card per program. */
export const fetchServiceCategories = () => api('/user/mentoring/categories')
