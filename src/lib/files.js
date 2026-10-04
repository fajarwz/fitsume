import {
  createLibrary,
  createResume,
  newResumeId,
  uniqueResumeName,
  validateLibrary,
} from './stash.js'

/**
 * Getting work in and out of the browser: one resume as markdown, the whole
 * library as JSON, and the download that delivers either.
 *
 * The library lives in localStorage, which is per-browser and can be cleared by
 * the user or by a browser update. A file on disk is the only backup that
 * survives that, so export/import is part of the product, not a nicety.
 *
 * Serialisation and merging are pure and tested; only `downloadText` touches the
 * DOM.
 */
export const MARKDOWN_TYPE = 'text/markdown;charset=utf-8'
export const JSON_TYPE = 'application/json;charset=utf-8'

export const MERGE_MODES = { merge: 'merge', replace: 'replace' }

/** A filename someone can recognise in their downloads folder. */
export function slugify(value, fallback = 'resume') {
  const slug = String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

  return slug || fallback
}

export function markdownFilename(name) {
  return `${slugify(name)}.md`
}

export function libraryFilename(now = new Date()) {
  const date = now.toISOString().slice(0, 10)

  return `fitsume-resumes-${date}.json`
}

export function exportResumeMarkdown(resume) {
  const markdown = resume?.markdown ?? ''

  return markdown.endsWith('\n') || markdown === '' ? markdown : `${markdown}\n`
}

/** Importing a .md file creates a resume; the heading inside it becomes the name. */
export function resumeFromMarkdown(markdown, { filename } = {}) {
  const text = typeof markdown === 'string' ? markdown : ''
  const fromFile = filename ? String(filename).replace(/\.(md|markdown|txt)$/i, '') : undefined

  return createResume({
    markdown: text,
    name: fromFile ? uniqueFilenameName(fromFile) : undefined,
  })
}

const uniqueFilenameName = (value) => value.replace(/[-_]+/g, ' ').trim() || undefined

export function exportLibraryJson(library, { now = new Date() } = {}) {
  return JSON.stringify({ ...library, exportedAt: now.toISOString() }, null, 2)
}

/**
 * Restoring a backup: merge keeps what is already there and adds what is missing,
 * replace throws the current library away. Merge is the default because the
 * destructive option should have to be chosen.
 */
export function parseLibraryJson(text) {
  let parsed

  try {
    parsed = JSON.parse(text)
  } catch {
    return { library: null, status: 'corrupt' }
  }

  const library = validateLibrary(parsed)

  if (!library) return { library: null, status: 'corrupt' }

  return { library, status: 'ok' }
}

/**
 * Ids that collide get new ones, so restoring the same backup twice cannot
 * overwrite the resume the user has been editing since.
 */
export function mergeLibraries(current, incoming, { mode = MERGE_MODES.merge } = {}) {
  const validated = validateLibrary(incoming)

  if (!validated) return current

  if (mode === MERGE_MODES.replace) {
    return { ...validated, activeId: validated.activeId ?? current.activeId }
  }

  let working = { ...current }
  const appended = []

  for (const resume of validated.resumes) {
    const collides = working.resumes.some((entry) => entry.id === resume.id)
    const next = collides
      ? {
          ...resume,
          id: newResumeId(),
          name: uniqueResumeName(working, resume.name),
        }
      : { ...resume, name: uniqueResumeName(working, resume.name) }

    working = { ...working, resumes: [...working.resumes, next] }
    appended.push(next)
  }

  return {
    ...working,
    activeId: appended[0]?.id ?? current.activeId ?? working.activeId,
  }
}

/**
 * The one DOM side effect in this file.
 *
 * An object URL is the right tool for a real download; a data URL covers
 * environments without `URL.createObjectURL` (and keeps the tests honest).
 */
export function downloadText({
  filename,
  text,
  type = MARKDOWN_TYPE,
  doc = globalThis.document,
  win = doc?.defaultView,
} = {}) {
  if (!doc?.createElement || !doc.body) return false

  let href = `data:${type},${encodeURIComponent(text)}`
  let revoke = () => {}

  if (win?.Blob && win?.URL?.createObjectURL) {
    const url = win.URL.createObjectURL(new win.Blob([text], { type }))

    href = url
    revoke = () => win.URL.revokeObjectURL(url)
  }

  const anchor = doc.createElement('a')

  anchor.href = href
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.style.display = 'none'

  doc.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  revoke()

  return true
}

export { createLibrary }
