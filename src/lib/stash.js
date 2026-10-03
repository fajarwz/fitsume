import { normaliseSettings } from './settings.js'
import { deriveTitle } from './title.js'

/**
 * The resume library: several named resumes, stored in the browser.
 *
 * There is no server and no account, so this file is the whole persistence layer.
 * Everything in it is a pure function over a plain library object — the storage
 * object is passed in, never reached for — which is what makes corruption,
 * migration and quota failures testable rather than hopeful.
 *
 * A library looks like:
 *
 *   { schemaVersion: 1, activeId: 'abc', resumes: [ { id, name, markdown, settings, createdAt, updatedAt } ] }
 *
 * The id is the identity, never the name: renaming a resume must not orphan its
 * data or break the active selection.
 */
export const SCHEMA_VERSION = 1
export const STORAGE_KEY = 'fittyresume.library'

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)

const timestamp = () => new Date().toISOString()

export function newResumeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()

  return `resume-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

/**
 * Used when the browser refuses to give us storage at all — private mode, a
 * blocked third-party context, a hardened profile. The app still works for the
 * session; it just says so.
 */
export function createMemoryStorage() {
  const entries = new Map()

  return {
    getItem: (key) => (entries.has(key) ? entries.get(key) : null),
    setItem: (key, value) => {
      entries.set(key, String(value))
    },
    removeItem: (key) => {
      entries.delete(key)
    },
  }
}

export function resolveStorage(candidate) {
  let storage = candidate

  if (storage === undefined) {
    try {
      storage = globalThis.localStorage ?? null
    } catch {
      storage = null
    }
  }

  if (!storage) return { storage: createMemoryStorage(), persistent: false }

  try {
    const probe = `${STORAGE_KEY}.probe`

    storage.setItem(probe, '1')
    storage.removeItem(probe)

    return { storage, persistent: true }
  } catch {
    return { storage: createMemoryStorage(), persistent: false }
  }
}

export function createLibrary() {
  return { schemaVersion: SCHEMA_VERSION, activeId: null, resumes: [] }
}

export function createResume({ id, name, markdown = '', settings, now } = {}) {
  const at = now ?? timestamp()

  return {
    id: id ?? newResumeId(),
    name: name ?? deriveTitle(markdown),
    markdown,
    settings: normaliseSettings(settings),
    createdAt: at,
    updatedAt: at,
  }
}

export function findResume(library, id) {
  return library.resumes.find((resume) => resume.id === id) ?? null
}

export function activeResume(library) {
  return findResume(library, library.activeId)
}

export function addResume(library, resume) {
  return {
    ...library,
    resumes: [...library.resumes, resume],
    activeId: resume.id,
  }
}

export function updateResume(library, id, patch, { now } = {}) {
  return {
    ...library,
    resumes: library.resumes.map((resume) =>
      resume.id === id
        ? {
            ...resume,
            ...patch,
            ...(patch.settings ? { settings: normaliseSettings(patch.settings) } : {}),
            updatedAt: now ?? timestamp(),
          }
        : resume,
    ),
  }
}

export function renameResume(library, id, name) {
  return updateResume(library, id, { name })
}

/** Removing the active resume selects its neighbour, so the editor is never left empty. */
export function removeResume(library, id) {
  const index = library.resumes.findIndex((resume) => resume.id === id)

  if (index === -1) return library

  const resumes = library.resumes.filter((resume) => resume.id !== id)
  const activeId =
    library.activeId === id ? (resumes[index] ?? resumes[index - 1] ?? null)?.id ?? null : library.activeId

  return { ...library, resumes, activeId }
}

export function setActiveResume(library, id) {
  return findResume(library, id) ? { ...library, activeId: id } : library
}

export function uniqueResumeName(library, base) {
  const taken = new Set(library.resumes.map((resume) => resume.name))

  if (!taken.has(base)) return base

  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${base} ${index}`

    if (!taken.has(candidate)) return candidate
  }

  return base
}

/** Copying a copy should not produce "Ada Lovelace copy copy". */
function copyName(library, name) {
  const stem = name.replace(/ copy( \d+)?$/, '')

  return uniqueResumeName(library, `${stem} copy`)
}

/** The copy lands directly after its original, which is where people look for it. */
export function duplicateResume(library, id, { now } = {}) {
  const index = library.resumes.findIndex((resume) => resume.id === id)

  if (index === -1) return library

  const original = library.resumes[index]
  const copy = {
    ...original,
    id: newResumeId(),
    name: copyName(library, original.name),
    settings: normaliseSettings(original.settings),
    createdAt: now ?? timestamp(),
    updatedAt: now ?? timestamp(),
  }

  const resumes = [...library.resumes]

  resumes.splice(index + 1, 0, copy)

  return { ...library, resumes, activeId: copy.id }
}

const isValidResume = (value) =>
  isObject(value) && typeof value.id === 'string' && value.id.length > 0 && typeof value.markdown === 'string'

function normaliseResume(raw) {
  const at = timestamp()

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newResumeId(),
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : deriveTitle(raw.markdown),
    markdown: raw.markdown,
    settings: normaliseSettings(raw.settings),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : at,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : at,
  }
}

/**
 * Repairs what it can and rejects what it cannot.
 *
 * Individual broken entries are dropped rather than failing the whole library:
 * losing one resume beats losing all of them.
 */
export function validateLibrary(value) {
  if (!isObject(value) || !Array.isArray(value.resumes)) return null

  const resumes = value.resumes.filter(isValidResume).map(normaliseResume)
  const activeId = resumes.some((resume) => resume.id === value.activeId)
    ? value.activeId
    : (resumes[0]?.id ?? null)

  return { schemaVersion: SCHEMA_VERSION, activeId, resumes }
}

/**
 * Version 0 was a single resume document, with the markdown at the top level.
 * Anything without a `resumes` array is treated as that shape.
 */
export function migrateLibrary(value) {
  if (!isObject(value)) return value
  if (Array.isArray(value.resumes)) return value

  if (typeof value.markdown === 'string') {
    const resume = normaliseResume(value)

    return { schemaVersion: SCHEMA_VERSION, activeId: resume.id, resumes: [resume] }
  }

  return value
}

export function loadLibrary(storage) {
  if (!storage || typeof storage.getItem !== 'function') {
    return { library: createLibrary(), status: 'unavailable' }
  }

  let raw

  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return { library: createLibrary(), status: 'unavailable' }
  }

  if (raw === null || raw === undefined || raw === '') {
    return { library: createLibrary(), status: 'empty' }
  }

  let parsed

  try {
    parsed = JSON.parse(raw)
  } catch {
    return { library: createLibrary(), status: 'corrupt' }
  }

  const migrated = migrateLibrary(parsed)
  const library = validateLibrary(migrated)

  if (!library) return { library: createLibrary(), status: 'corrupt' }

  return { library, status: migrated === parsed ? 'ok' : 'migrated' }
}

export function saveLibrary(storage, library) {
  if (!storage || typeof storage.setItem !== 'function') {
    return { saved: false, reason: 'unavailable' }
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(library))

    return { saved: true }
  } catch (error) {
    return { saved: false, reason: error?.name === 'QuotaExceededError' ? 'quota' : 'failed' }
  }
}
