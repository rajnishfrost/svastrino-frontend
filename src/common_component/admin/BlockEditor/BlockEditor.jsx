import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import Checklist from '@editorjs/checklist'
import Table from '@editorjs/table'
import Quote from '@editorjs/quote'
import Delimiter from '@editorjs/delimiter'
import ImageTool from '@editorjs/image'
import Embed from '@editorjs/embed'
import Marker from '@editorjs/marker'
import InlineCode from '@editorjs/inline-code'
import Underline from '@editorjs/underline'
import AlignmentTune from 'editorjs-text-alignment-blocktune'
import { apiUpload } from '../../../api/client.js'
import './BlockEditor.css'

/**
 * Editor.js as an admin form field.
 *
 * The editor owns its content once it has mounted — React never re-renders it
 * from a `value` prop, because typing into a rich editor and having the page
 * push its own idea of the text back in is how a cursor ends up jumping to the
 * start of a line. So content goes in once, and the form asks for it back when
 * it saves:
 *
 *     const overview = useRef(null)
 *     <BlockEditor ref={overview} value={course.overviewBlocks} />
 *     const doc = await overview.current.save()
 *
 * Only the blocks the public page can draw are offered — see richText.js on the
 * server, which drops anything else on save, and RichText.jsx, which draws
 * them. All three lists have to agree.
 */

/**
 * Images go through the panel's existing upload endpoint — the same one the
 * blog cover art uses — so there is one place that decides where editorial
 * images live. Editor.js wants its own response shape, hence the mapping.
 */
const uploader = {
  async uploadByFile(file) {
    const fd = new FormData()
    fd.append('image', file)
    const { url } = await apiUpload('/admin/upload/image', fd, { auth: 'admin' })
    return { success: 1, file: { url } }
  },
  // Pasting an address. The server checks it again on save; this only keeps
  // an obviously wrong one from being inserted in the first place.
  async uploadByUrl(url) {
    if (!/^https:\/\//i.test(url)) throw new Error('Image address must start with https://')
    return { success: 1, file: { url } }
  },
}

const ALIGNABLE = ['paragraph', 'header', 'quote', 'image', 'table', 'list']

const TOOLS = {
  header: {
    class: Header,
    inlineToolbar: true,
    tunes: ['alignment'],
    config: { levels: [2, 3, 4], defaultLevel: 2, placeholder: 'Section heading' },
  },
  paragraph: { tunes: ['alignment'] },
  list: { class: List, inlineToolbar: true, tunes: ['alignment'], config: { defaultStyle: 'unordered' } },
  checklist: { class: Checklist, inlineToolbar: true },
  table: {
    class: Table,
    inlineToolbar: true,
    tunes: ['alignment'],
    config: { rows: 3, cols: 3, withHeadings: true },
  },
  quote: {
    class: Quote,
    inlineToolbar: true,
    tunes: ['alignment'],
    config: { quotePlaceholder: 'Quote', captionPlaceholder: 'Who said it (optional)' },
  },
  image: { class: ImageTool, tunes: ['alignment'], config: { uploader, captionPlaceholder: 'Caption (optional)' } },
  // Only the services the page is willing to frame — see EMBED_HOSTS on both
  // the server and the renderer.
  embed: { class: Embed, config: { services: { youtube: true, vimeo: true } } },
  delimiter: Delimiter,

  // Inline (select text) and block tunes (the ⋮⋮ menu).
  marker: Marker,
  inlineCode: InlineCode,
  underline: Underline,
  alignment: {
    class: AlignmentTune,
    config: { default: 'left', blocks: Object.fromEntries(ALIGNABLE.map((b) => [b, 'left'])) },
  },
}

/**
 * The list tool works in `{ content, meta, items }` items; the database stores
 * the same shape without the tool's own bookkeeping, so it is put back on the
 * way in. (Plain strings are what the tool wrote in its previous major version
 * — old rows are read too.)
 */
const withMeta = (items) =>
  (Array.isArray(items) ? items : []).map((it) =>
    typeof it === 'string'
      ? { content: it, meta: {}, items: [] }
      : { content: it?.content || '', meta: it?.meta || {}, items: withMeta(it?.items) }
  )

const toEditorData = (doc) => {
  if (!doc || !Array.isArray(doc.blocks) || !doc.blocks.length) return undefined
  return {
    ...doc,
    blocks: doc.blocks.map((b) =>
      b.type === 'list'
        ? { ...b, data: { ...b.data, meta: b.data?.meta || {}, items: withMeta(b.data?.items) } }
        : b
    ),
  }
}

const BlockEditor = forwardRef(function BlockEditor(
  { value, placeholder = 'Write the overview…', minHeight = 160 },
  ref
) {
  const holder = useRef(null)
  const editor = useRef(null)
  // What was loaded, returned as-is if the form saves before the editor is up.
  const initial = useRef(value ?? null)
  // Starting and tearing down an editor are both asynchronous, and React's
  // development mode mounts every component twice. Run in sequence — start,
  // tear down, start — or the second editor draws itself into the holder just
  // before the first one finishes leaving and empties it, and the field comes
  // up blank.
  const queue = useRef(Promise.resolve())

  useEffect(() => {
    let alive = true
    let instance = null

    const started = queue.current
      .then(() => {
        if (!alive) return null
        instance = new EditorJS({
          holder: holder.current,
          data: toEditorData(initial.current),
          tools: TOOLS,
          placeholder,
          minHeight,
        })
        editor.current = instance
        return instance.isReady
      })
      .catch(() => {})
    queue.current = started

    return () => {
      alive = false
      editor.current = null
      queue.current = started.then(() => instance?.destroy()).catch(() => {})
    }
    // Mount once: `value` is the starting content, not a live binding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useImperativeHandle(ref, () => ({
    /** The document as it stands, or null when the editor is empty. */
    async save() {
      await queue.current.catch(() => {})
      if (!editor.current) return initial.current
      const doc = await editor.current.save()
      return doc?.blocks?.length ? doc : null
    },
  }))

  return (
    <div className="adm-blockeditor">
      {/* Editor.js keeps its toolbar hidden until a line is clicked, which
          leaves the field looking like a plain box of text. This says what it
          is, so nobody has to discover it by accident. */}
      <p className="adm-blockeditor__bar">
        This is the page. Click a line, then <strong>⊕</strong> for a heading, list,
        table, image, checklist or video — <strong>⋮⋮</strong> aligns a block, and
        selecting text gives bold, link, underline and highlight.
      </p>
      <div className="adm-blockeditor__canvas" ref={holder} />
    </div>
  )
})

export default BlockEditor
