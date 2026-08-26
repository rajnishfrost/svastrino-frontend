import { useCallback, useEffect, useState } from 'react'
import { api, apiUpload } from '../../../api/client.js'
import { legacyRootSeo } from '../../../seo/legacyRootSeo.js'
import ConfirmModal from '../../../common_component/admin/ConfirmModal/ConfirmModal.jsx'
import Pager from '../../../common_component/admin/Pager/Pager.jsx'
import '../adminShared.css'

/**
 * Blog — write, edit, publish and delete posts. Drafts (`published: false`) are
 * visible here but nowhere on the public site, so a post can be prepared ahead
 * of time. The body is markdown, the same as the imported WordPress content.
 */
const slugify = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const PER_PAGE = 20
const OWNERS = [{ value: 'svastrino', label: 'Svastrino' }, { value: 'nirmaan', label: 'Nirmaan' }]

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
// <input type="date"> wants YYYY-MM-DD in LOCAL time — toISOString() would shift
// the day backwards for anyone east of UTC (i.e. everyone here).
const toDateInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const blank = {
  title: '', slug: '', owner: 'svastrino', author: 'Svastrino', categories: '',
  excerpt: '', body: '', coverImage: '', sourceUrl: '',
  publishedAt: toDateInput(new Date().toISOString()), readingMins: '', order: '', published: true,
  seoTitle: '', seoDescription: '',
}

export default function AdminBlogs() {
  const [posts, setPosts] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')

  // filters
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [owner, setOwner] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)

  const [editing, setEditing] = useState(null) // post row | 'new' | null
  const [del, setDel] = useState(null) // post pending delete
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) })
    if (q.trim()) params.set('q', q.trim())
    if (status) params.set('status', status)
    if (owner) params.set('owner', owner)
    if (category) params.set('category', category)

    api(`/admin/blogs?${params}`, { auth: 'admin' })
      .then((d) => { setPosts(d.posts); setPagination(d.pagination); setError('') })
      .catch((e) => setError(e.message))
  }, [page, q, status, owner, category])

  // Debounced so typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  useEffect(() => {
    api('/admin/blogs/categories', { auth: 'admin' })
      .then((d) => setCategories(d.categories))
      .catch(() => {})
  }, [])

  // Any filter change puts you back on page 1 — page 4 of the old result set is
  // usually empty in the new one.
  useEffect(() => { setPage(1) }, [q, status, owner, category])

  const refresh = () => { load(); api('/admin/blogs/categories', { auth: 'admin' }).then((d) => setCategories(d.categories)).catch(() => {}) }

  const doDelete = async () => {
    setBusy(true)
    try {
      await api(`/admin/blogs/${del.id}`, { method: 'DELETE', auth: 'admin' })
      setDel(null)
      refresh()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const togglePublish = async (p) => {
    try {
      await api(`/admin/blogs/${p.id}`, { method: 'PATCH', auth: 'admin', body: { published: !p.published } })
      load()
    } catch (e) { setError(e.message) }
  }

  if (editing) {
    return (
      <PostEditor
        post={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onSaved={() => { setEditing(null); refresh() }}
      />
    )
  }

  return (
    <div>
      <h1 className="adm-title">Blog</h1>
      <p className="adm-sub">Write and publish posts. Drafts stay hidden from the site until you publish them.</p>

      <div className="adm-toolbar">
        <input
          className="adm-input" style={{ width: 240 }} value={q}
          onChange={(e) => setQ(e.target.value)} placeholder="Search title, slug or author…"
        />
        <select className="adm-select" style={{ width: 150 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
        <select className="adm-select" style={{ width: 150 }} value={owner} onChange={(e) => setOwner(e.target.value)}>
          <option value="">All brands</option>
          {OWNERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="adm-select" style={{ width: 190 }} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.name} value={c.name}>{c.name} ({c.count})</option>)}
        </select>
        <button className="adm-btn" onClick={() => setEditing('new')}>+ New post</button>
      </div>

      {error && <p className="adm-error">{error}</p>}

      {!posts ? <p className="adm-empty">Loading…</p> : posts.length === 0 ? (
        <p className="adm-empty">No posts match these filters.</p>
      ) : (
        <>
          <div className="adm-panel adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>Title</th><th>Brand</th><th>Categories</th><th>Published</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.title}</strong>
                      <p className="adm-sub" style={{ margin: '2px 0 0', fontSize: 12.5 }}>/blog/{p.slug} · {p.author}</p>
                    </td>
                    <td><span className="adm-badge adm-badge--muted">{p.owner === 'nirmaan' ? 'Nirmaan' : 'Svastrino'}</span></td>
                    <td style={{ fontSize: 13 }}>{p.categories.length ? p.categories.join(', ') : '—'}</td>
                    <td className="adm-num" style={{ whiteSpace: 'nowrap' }}>{fmtDate(p.publishedAt)}</td>
                    <td>
                      <span className={`adm-badge adm-badge--${p.published ? 'ok' : 'muted'}`}>
                        {p.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="adm-link" onClick={() => setEditing(p)}>Edit</button>
                      <button className="adm-link" onClick={() => togglePublish(p)}>{p.published ? 'Unpublish' : 'Publish'}</button>
                      {p.published && (
                        <a className="adm-link" href={`/blog/${p.slug}`} target="_blank" rel="noreferrer"
                           style={{ textDecoration: 'none' }}>View ↗</a>
                      )}
                      <button className="adm-link" style={{ color: 'var(--color-danger)' }} onClick={() => setDel(p)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pager page={pagination.page} pages={pagination.pages} total={pagination.total} onChange={setPage} unit="post" />
        </>
      )}

      {del && (
        <ConfirmModal
          title={`Delete “${del.title}”?`}
          message="The post and its URL are removed for good. This can't be undone."
          confirmLabel="Delete post"
          danger
          busy={busy}
          onConfirm={doDelete}
          onCancel={() => setDel(null)}
        />
      )}
    </div>
  )
}

/* ---------------- editor ---------------- */

function PostEditor({ post, onCancel, onSaved }) {
  const [f, setF] = useState(blank)
  const [loading, setLoading] = useState(!!post)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pct, setPct] = useState(0)
  const [err, setErr] = useState('')
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  // What svastrino.com shows for this address today, offered as the placeholder.
  const legacy = legacyRootSeo(f.slug)

  // The table rows have no `body` (it's stripped from listings), so an edit
  // always refetches the full record.
  useEffect(() => {
    if (!post) return
    api(`/admin/blogs/${post.id}`, { auth: 'admin' })
      .then(({ post: p }) => setF({
        title: p.title, slug: p.slug, owner: p.owner, author: p.author,
        categories: (p.categories || []).join(', '),
        excerpt: p.excerpt || '', body: p.body || '', coverImage: p.coverImage || '',
        sourceUrl: p.sourceUrl || '', publishedAt: toDateInput(p.publishedAt),
        readingMins: p.readingMins ?? '', order: p.order ?? '', published: p.published,
        seoTitle: p.seoTitle || '', seoDescription: p.seoDescription || '',
      }))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false))
  }, [post])

  const onTitle = (title) =>
    // Keep the slug tracking the title until it's been edited by hand — and
    // never touch it once the post exists (it's a live public URL).
    setF((p) => (post || (p.slug && p.slug !== slugify(p.title))
      ? { ...p, title }
      : { ...p, title, slug: slugify(title) }))

  const onImage = async (file) => {
    if (!file) return
    setErr(''); setUploading(true); setPct(0)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const { url } = await apiUpload('/admin/upload/image', fd, { auth: 'admin', onProgress: setPct })
      set('coverImage', url)
    } catch (e) { setErr(e.message) } finally { setUploading(false); setPct(0) }
  }

  const save = async () => {
    if (!f.title.trim()) return setErr('Title is required')
    setBusy(true); setErr('')
    const body = {
      title: f.title, slug: f.slug, owner: f.owner, author: f.author,
      categories: f.categories.split(',').map((s) => s.trim()).filter(Boolean),
      excerpt: f.excerpt, body: f.body, coverImage: f.coverImage, sourceUrl: f.sourceUrl,
      published: f.published,
      order: f.order === '' ? 0 : Number(f.order),
      readingMins: f.readingMins === '' ? '' : Number(f.readingMins),
      seoTitle: f.seoTitle, seoDescription: f.seoDescription,
      ...(f.publishedAt ? { publishedAt: f.publishedAt } : {}),
    }
    try {
      if (post) await api(`/admin/blogs/${post.id}`, { method: 'PATCH', auth: 'admin', body })
      else await api('/admin/blogs', { method: 'POST', auth: 'admin', body })
      onSaved()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  if (loading) return <p className="adm-empty">Loading post…</p>

  return (
    <div>
      <button className="adm-link" style={{ padding: 0, marginBottom: 8 }} onClick={onCancel}>← Back to all posts</button>
      <h1 className="adm-title">{post ? 'Edit post' : 'New post'}</h1>
      <p className="adm-sub">The body is markdown — headings (<code>##</code>), <code>**bold**</code>, lists and links all render on the site.</p>

      <div className="adm-panel">
        <div className="adm-row2">
          <div className="adm-field"><label>Title</label>
            <input className="adm-input" value={f.title} onChange={(e) => onTitle(e.target.value)} placeholder="How to choose a stream after 10th" /></div>
          <div className="adm-field"><label>Slug — the URL: svastrino.com/<em>{f.slug || '…'}</em></label>
            <input className="adm-input" value={f.slug} onChange={(e) => set('slug', slugify(e.target.value))} /></div>
        </div>

        {/* What search engines show. Left blank, the page keeps the wording
            svastrino.com published for this address — which is what it has
            ranked with for years — so these are shown as the placeholder
            rather than filled in, and only a deliberate entry overrides it. */}
        <div className="adm-panel-sub">
          <p className="adm-sub" style={{ margin: '0 0 10px' }}>
            Search result — leave blank to keep what svastrino.com already shows
          </p>
          <div className="adm-field"><label>Search title</label>
            <input className="adm-input" value={f.seoTitle}
              onChange={(e) => set('seoTitle', e.target.value)}
              placeholder={legacy?.title || 'Uses the title above'} /></div>
          <div className="adm-field"><label>Search description</label>
            <textarea className="adm-input" rows={2} value={f.seoDescription}
              onChange={(e) => set('seoDescription', e.target.value)}
              placeholder={legacy?.description || 'Uses the opening lines of the page'} /></div>
        </div>

        <div className="adm-row2">
          <div className="adm-field"><label>Brand</label>
            <select className="adm-select" value={f.owner} onChange={(e) => set('owner', e.target.value)}>
              {OWNERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select></div>
          <div className="adm-field"><label>Author</label>
            <input className="adm-input" value={f.author} onChange={(e) => set('author', e.target.value)} /></div>
        </div>

        <div className="adm-field"><label>Categories (comma separated)</label>
          <input className="adm-input" value={f.categories} onChange={(e) => set('categories', e.target.value)}
                 placeholder="Career Guidance, Parenting" /></div>

        <div className="adm-field"><label>Excerpt — the summary shown on the listing card</label>
          <textarea className="adm-textarea" rows={2} value={f.excerpt} onChange={(e) => set('excerpt', e.target.value)} /></div>

        <div className="adm-field">
          <label>Cover image — paste a URL or upload</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input className="adm-input" style={{ flex: 1, minWidth: 240 }} value={f.coverImage}
                   onChange={(e) => set('coverImage', e.target.value)} placeholder="https://…/cover.jpg" />
            <label className="adm-btn adm-btn--ghost" style={{ cursor: uploading ? 'default' : 'pointer', margin: 0, whiteSpace: 'nowrap' }}>
              {uploading ? 'Uploading…' : '⤒ Upload'}
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploading}
                     onChange={(e) => onImage(e.target.files?.[0])} />
            </label>
          </div>
          {uploading && (
            <div className="adm-progress">
              <div className="adm-progress-track"><span style={{ width: `${pct}%` }} /></div>
              <p className="adm-progress-label">Uploading… {pct}%</p>
            </div>
          )}
          {f.coverImage && !uploading && (
            <img src={f.coverImage} alt="" className="adm-cover-preview"
                 onError={(e) => { e.currentTarget.style.display = 'none' }} />
          )}
        </div>

        <div className="adm-field"><label>Body (markdown)</label>
          <textarea className="adm-textarea" rows={18} style={{ fontFamily: 'var(--font-mono, ui-monospace, Menlo, monospace)', fontSize: 13.5 }}
                    value={f.body} onChange={(e) => set('body', e.target.value)}
                    placeholder={'## Section heading\n\nYour paragraph…\n\n- point one\n- point two'} /></div>

        <div className="adm-row2">
          <div className="adm-field"><label>Publish date</label>
            <input className="adm-input" type="date" value={f.publishedAt} onChange={(e) => set('publishedAt', e.target.value)} /></div>
          <div className="adm-field"><label>Reading time (mins) — blank = auto from the body</label>
            <input className="adm-input adm-num" type="number" min="1" value={f.readingMins} onChange={(e) => set('readingMins', e.target.value)} /></div>
        </div>

        <div className="adm-row2">
          <div className="adm-field"><label>Original URL (optional — for migrated posts)</label>
            <input className="adm-input" value={f.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} /></div>
          <div className="adm-field"><label>Order (tie-breaker when two posts share a date)</label>
            <input className="adm-input adm-num" type="number" value={f.order} onChange={(e) => set('order', e.target.value)} /></div>
        </div>

        <div style={{ margin: '4px 0 14px', fontSize: 14 }}>
          <label><input type="checkbox" checked={f.published} onChange={(e) => set('published', e.target.checked)} /> Published (visible on the site)</label>
        </div>

        {err && <p className="adm-error">{err}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="adm-btn" onClick={save} disabled={busy || uploading || !f.title.trim() || !f.slug}>
            {busy ? 'Saving…' : post ? 'Save changes' : 'Create post'}
          </button>
          <button className="adm-btn adm-btn--ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
