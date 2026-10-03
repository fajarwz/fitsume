import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FONT_SIZE_MAX } from './page.js'
import { DEFAULT_RESUME_SETTINGS } from './settings.js'
import {
  SCHEMA_VERSION,
  STORAGE_KEY,
  activeResume,
  addResume,
  createLibrary,
  createMemoryStorage,
  createResume,
  duplicateResume,
  findResume,
  loadLibrary,
  migrateLibrary,
  removeResume,
  renameResume,
  resolveStorage,
  saveLibrary,
  setActiveResume,
  updateResume,
  validateLibrary,
} from './stash.js'

const NOW = '2026-01-01T00:00:00.000Z'

const resume = (overrides = {}) =>
  createResume({ id: 'r1', name: 'Ada Lovelace', markdown: '# Ada Lovelace', now: NOW, ...overrides })

const libraryWith = (...resumes) => ({
  schemaVersion: SCHEMA_VERSION,
  activeId: resumes[resumes.length - 1]?.id ?? null,
  resumes,
})

describe('createResume', () => {
  it('names a resume after its own heading', () => {
    expect(createResume({ markdown: '# Rizky Pratama\nEngineer' }).name).toBe('Rizky Pratama')
  })

  it('falls back to a visible name when the markdown has no heading', () => {
    expect(createResume({ markdown: '' }).name).toBe('Resume')
  })

  it('gives every resume an id, and they are all different', () => {
    const ids = new Set(Array.from({ length: 50 }, () => createResume({ markdown: '# X' }).id))

    expect(ids.size).toBe(50)
  })

  it('starts from the default settings, normalised', () => {
    expect(createResume({ markdown: '# X' }).settings).toEqual(DEFAULT_RESUME_SETTINGS)

    // 900 is out of range, so it comes back at the top of the slider, not at 900.
    expect(createResume({ markdown: '# X', settings: { baseFontSize: 900 } }).settings.baseFontSize).toBe(
      FONT_SIZE_MAX,
    )
  })
})

describe('library operations', () => {
  it('adds a resume and makes it active', () => {
    const library = addResume(createLibrary(), resume())

    expect(library.resumes).toHaveLength(1)
    expect(library.activeId).toBe('r1')
  })

  it('keeps the id stable when a resume is renamed', () => {
    // The id is the identity: renaming must not orphan the stored settings.
    const library = renameResume(libraryWith(resume()), 'r1', 'Ada L.')

    expect(library.resumes[0].name).toBe('Ada L.')
    expect(library.resumes[0].id).toBe('r1')
    expect(library.activeId).toBe('r1')
  })

  it('updates one resume without touching the others', () => {
    const other = resume({ id: 'r2', name: 'Grace Hopper' })
    const library = updateResume(libraryWith(resume(), other), 'r1', { markdown: '# Changed' })

    expect(findResume(library, 'r1').markdown).toBe('# Changed')
    expect(findResume(library, 'r2').markdown).toBe(other.markdown)
    expect(findResume(library, 'r1').updatedAt).not.toBe(NOW)
  })

  it('normalises settings on the way in, not just on load', () => {
    const library = updateResume(libraryWith(resume()), 'r1', {
      settings: { baseFontSize: 11, padding: 400 },
    })

    expect(findResume(library, 'r1').settings).toMatchObject({ baseFontSize: 11, padding: 80 })
  })

  it('selects the next resume when the active one is deleted', () => {
    const library = removeResume(libraryWith(resume(), resume({ id: 'r2' }), resume({ id: 'r3' })), 'r2')

    expect(library.resumes.map((entry) => entry.id)).toEqual(['r1', 'r3'])
    expect(library.activeId).toBe('r3')
  })

  it('selects the previous resume when the last one is deleted', () => {
    const library = removeResume(libraryWith(resume(), resume({ id: 'r2' })), 'r2')

    expect(library.activeId).toBe('r1')
  })

  it('leaves the active selection alone when a different resume is deleted', () => {
    const library = removeResume(libraryWith(resume(), resume({ id: 'r2' })), 'r1')

    expect(library.activeId).toBe('r2')
  })

  it('ends up with nothing active in an empty library', () => {
    const library = removeResume(libraryWith(resume()), 'r1')

    expect(library.resumes).toEqual([])
    expect(library.activeId).toBeNull()
    expect(activeResume(library)).toBeNull()
  })

  it('ignores an id that is not there', () => {
    const library = libraryWith(resume())

    expect(removeResume(library, 'nope')).toEqual(library)
    expect(setActiveResume(library, 'nope')).toEqual(library)
    expect(duplicateResume(library, 'nope')).toEqual(library)
  })

  it('copies a resume directly after its original, with its own id', () => {
    const library = duplicateResume(libraryWith(resume(), resume({ id: 'r2' })), 'r1')

    expect(library.resumes.map((entry) => entry.id)).toEqual(['r1', expect.any(String), 'r2'])
    expect(library.resumes[1].name).toBe('Ada Lovelace copy')
    expect(library.resumes[1].id).not.toBe('r1')
    expect(library.activeId).toBe(library.resumes[1].id)
  })

  it('numbers repeated copies instead of colliding on the name', () => {
    const library = duplicateResume(libraryWith(resume()), 'r1')
    const again = duplicateResume(library, library.activeId)

    expect(again.resumes.map((entry) => entry.name)).toEqual([
      'Ada Lovelace',
      'Ada Lovelace copy',
      'Ada Lovelace copy 2',
    ])
  })
})

describe('validateLibrary', () => {
  it('rejects anything that is not a library', () => {
    expect(validateLibrary(null)).toBeNull()
    expect(validateLibrary('nope')).toBeNull()
    expect(validateLibrary([])).toBeNull()
    expect(validateLibrary({ resumes: 'nope' })).toBeNull()
  })

  it('drops broken entries and keeps the good ones', () => {
    const library = validateLibrary({
      resumes: [resume(), { id: 'broken' }, null, { id: 'ok', markdown: '# Fine', name: '' }],
    })

    expect(library.resumes.map((entry) => entry.id)).toEqual(['r1', 'ok'])
    expect(library.resumes[1].name).toBe('Fine')
  })

  it('falls back to the first resume when the active id is gone', () => {
    const library = validateLibrary({ activeId: 'missing', resumes: [resume()] })

    expect(library.activeId).toBe('r1')
  })

  it('accepts an empty library, because deleting everything is allowed', () => {
    expect(validateLibrary({ resumes: [] })).toEqual({
      schemaVersion: SCHEMA_VERSION,
      activeId: null,
      resumes: [],
    })
  })
})

describe('migrateLibrary', () => {
  it('wraps the old single-resume shape into a library', () => {
    const migrated = migrateLibrary({ markdown: '# Ada Lovelace', settings: { baseFontSize: 12 } })

    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION)
    expect(migrated.resumes).toHaveLength(1)
    expect(migrated.activeId).toBe(migrated.resumes[0].id)
    expect(migrated.resumes[0].settings.baseFontSize).toBe(12)
  })

  it('leaves a current library alone, by identity', () => {
    const library = createLibrary()

    expect(migrateLibrary(library)).toBe(library)
  })

  it('does not invent a resume out of junk', () => {
    expect(migrateLibrary({ some: 'junk' })).toEqual({ some: 'junk' })
  })
})

describe('loadLibrary / saveLibrary', () => {
  let storage

  beforeEach(() => {
    storage = createMemoryStorage()
  })

  it('round-trips a library', () => {
    const library = addResume(createLibrary(), resume())

    expect(saveLibrary(storage, library)).toEqual({ saved: true })

    const loaded = loadLibrary(storage)

    expect(loaded.status).toBe('ok')
    expect(loaded.library).toEqual(library)
  })

  it('remembers which resume was open', () => {
    const library = setActiveResume(
      libraryWith(resume(), resume({ id: 'r2' })),
      'r1',
    )

    saveLibrary(storage, library)

    expect(loadLibrary(storage).library.activeId).toBe('r1')
  })

  it('reports an empty library rather than an error on first run', () => {
    const loaded = loadLibrary(storage)

    expect(loaded.status).toBe('empty')
    expect(loaded.library.resumes).toEqual([])
    expect(loaded.library.activeId).toBeNull()
  })

  it('survives data that is not JSON at all', () => {
    storage.setItem(STORAGE_KEY, '{ not json')

    const loaded = loadLibrary(storage)

    expect(loaded.status).toBe('corrupt')
    expect(loaded.library.resumes).toEqual([])
  })

  it('survives JSON of the wrong shape', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 99, hello: 'there' }))

    expect(loadLibrary(storage).status).toBe('corrupt')
  })

  it('reports that it migrated an old library', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ markdown: '# Old Resume' }))

    const loaded = loadLibrary(storage)

    expect(loaded.status).toBe('migrated')
    expect(loaded.library.resumes[0].name).toBe('Old Resume')
  })

  it('says so when the browser gives it no storage at all', () => {
    expect(loadLibrary(null)).toEqual({ library: createLibrary(), status: 'unavailable' })
    expect(saveLibrary(null, createLibrary())).toEqual({ saved: false, reason: 'unavailable' })
  })

  it('reports a full disk rather than failing silently', () => {
    const full = {
      getItem: () => null,
      setItem: () => {
        const error = new Error('quota')
        error.name = 'QuotaExceededError'
        throw error
      },
    }

    expect(saveLibrary(full, addResume(createLibrary(), resume()))).toEqual({
      saved: false,
      reason: 'quota',
    })
  })

  it('reports any other write failure too', () => {
    const broken = {
      getItem: () => null,
      setItem: () => {
        throw new Error('nope')
      },
    }

    expect(saveLibrary(broken, createLibrary())).toEqual({ saved: false, reason: 'failed' })
  })

  it('survives a storage object that throws on read', () => {
    const hostile = {
      getItem: () => {
        throw new Error('SecurityError')
      },
    }

    expect(loadLibrary(hostile).status).toBe('unavailable')
  })
})

describe('resolveStorage', () => {
  it('uses the browser store when it is usable, and says it is persistent', () => {
    const real = createMemoryStorage()
    const resolved = resolveStorage(real)

    expect(resolved.storage).toBe(real)
    expect(resolved.persistent).toBe(true)
  })

  it('falls back to memory when the browser refuses to write', () => {
    const blocked = {
      getItem: () => null,
      setItem: () => {
        throw new Error('SecurityError')
      },
      removeItem: () => {},
    }

    const resolved = resolveStorage(blocked)

    expect(resolved.persistent).toBe(false)

    const library = addResume(createLibrary(), resume())

    expect(saveLibrary(resolved.storage, library).saved).toBe(true)
    expect(loadLibrary(resolved.storage).library.resumes[0].id).toBe('r1')
  })

  it('probes the store rather than assuming it works', () => {
    const spy = createMemoryStorage()
    const setItem = vi.fn(spy.setItem)

    resolveStorage({ ...spy, setItem })

    expect(setItem).toHaveBeenCalled()
  })
})
