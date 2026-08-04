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

/** One course detail page. → { course } */
export const fetchCourse = (slug) => api(`/user/content/courses/${encodeURIComponent(slug)}`)

/** One policy/legal page (markdown body). → { page } */
export const fetchSitePage = (slug) => api(`/user/content/pages/${encodeURIComponent(slug)}`)

/** Quick News headlines, newest first. → { news, pagination } */
export const fetchNews = (page = 1, limit = 30) =>
  api(`/user/content/news?page=${page}&limit=${limit}`)
