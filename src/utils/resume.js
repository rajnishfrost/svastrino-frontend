/**
 * Three small memories, all per student, all in this browser's storage.
 *   resume — where they are in a video, so the player can offer to pick up
 *            from there. The server keeps a copy too, for their other devices;
 *            this one is instant and works offline.
 *   draft  — an answer they were typing and had not sent yet. Leaving the
 *            page mid-answer used to lose it.
 *   plays  — how many times they have started a video. The server holds the
 *            real count, but it cannot be reached from a downloaded video on a
 *            plane, so the limit is judged against whichever is higher.
 * Keyed by user as well as by video/question, so two students on one device
 * never see each other's place or words.
 */
const key = (kind, uid, id) => `svastrino:${kind}:v1:${uid || 'guest'}:${id}`
const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null') } catch { return null } }
const write = (k, v) => {
  try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)) } catch { /* quota / private mode */ }
}

/** { s: seconds, at: epoch ms } or null. */
export const readResume = (uid, sid) => read(key('resume', uid, sid))
export const writeResume = (uid, sid, s) => write(key('resume', uid, sid), s > 0 ? { s, at: Date.now() } : null)

export const readDraft = (uid, qid) => read(key('draft', uid, qid)) || ''
export const writeDraft = (uid, qid, text) => write(key('draft', uid, qid), text && text.trim() ? text : null)
export const clearDraft = (uid, qid) => write(key('draft', uid, qid), null)

export const readPlays = (uid, sid) => read(key('plays', uid, sid)) || 0
export const writePlays = (uid, sid, n) => write(key('plays', uid, sid), n > 0 ? n : null)
