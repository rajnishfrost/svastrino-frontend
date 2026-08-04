import { api } from './client.js'

const qs = (params) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') search.set(k, v)
  })
  const s = search.toString()
  return s ? `?${s}` : ''
}

/** Paginated listing. → { posts, pagination } */
export const fetchBlogs = ({ page, limit, category, owner, q } = {}) =>
  api(`/user/blogs${qs({ page, limit, category, owner, q })}`)

/** Filter bar counts. → { categories: [{ name, count }] } */
export const fetchBlogCategories = () => api('/user/blogs/categories')

/** Newest posts for the homepage strip. → { posts } */
export const fetchLatestBlogs = (limit = 3) => api(`/user/blogs/latest${qs({ limit })}`)

/** One article plus related posts. → { post, related } */
export const fetchBlog = (slug) => api(`/user/blogs/${encodeURIComponent(slug)}`)
