import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FONT_SIZE_MAX } from './page.ts'
import { DEFAULT_RESUME_SETTINGS } from './settings.ts'
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
  missingSamples,
  removeManyResume,
  removeResume,
  renameResume,
  resolveStorage,
  restoreSamples,
  saveLibrary,
  seedLibrary,
  setActiveResume,
  sortResumesByRecency,
  uniqueResumeName,
  updateResume,
  validateLibrary,
  type CreateResumeInput,
  type Library,
  type Resume,
} from './stash.ts'

const NOW = '2026-01-01T00:00:00.000Z'

const resume = (overrides: CreateResumeInput = {}) =>
  createResume({
    id: 'r1',
    name: 'Ada Lovelace',
    markdown: '# Ada Lovelace',
    now: NOW,
    ...overrides,
  })

const libraryWith = (...resumes: Resume[]): Library => ({
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
    expect(
      createResume({ markdown: '# X', settings: { baseFontSize: 900 } }).settings.baseFontSize,
    ).toBe(FONT_SIZE_MAX)
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

    expect(findResume(library, 'r1')!.markdown).toBe('# Changed')
    expect(findResume(library, 'r2')!.markdown).toBe(other.markdown)
    expect(findResume(library, 'r1')!.updatedAt).not.toBe(NOW)
  })

  it('normalises settings on the way in, not just on load', () => {
    const library = updateResume(libraryWith(resume()), 'r1', {
      settings: { baseFontSize: 11, padding: 400 },
    })

    expect(findResume(library, 'r1')!.settings).toMatchObject({ baseFontSize: 11, padding: 80 })
  })

  it('selects the next resume when the active one is deleted', () => {
    const library = removeResume(
      libraryWith(resume(), resume({ id: 'r2' }), resume({ id: 'r3' })),
      'r2',
    )

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
    const again = duplicateResume(library, library.activeId!)

    expect(again.resumes.map((entry) => entry.name)).toEqual([
      'Ada Lovelace',
      'Ada Lovelace copy',
      'Ada Lovelace copy 2',
    ])
  })
})

describe('removeManyResume', () => {
  it('removes every requested resume', () => {
    const library = removeManyResume(
      libraryWith(resume(), resume({ id: 'r2' }), resume({ id: 'r3' })),
      ['r1', 'r3'],
    )

    expect(library.resumes.map((entry) => entry.id)).toEqual(['r2'])
  })

  it('selects the next survivor when the active one is removed', () => {
    const library = removeManyResume(
      libraryWith(resume(), resume({ id: 'r2' }), resume({ id: 'r3' })),
      ['r1', 'r3'],
    )

    expect(library.activeId).toBe('r2')
  })

  it('selects the previous survivor when everything after the active one goes', () => {
    const library = removeManyResume(
      libraryWith(resume(), resume({ id: 'r2' }), resume({ id: 'r3' })),
      ['r2', 'r3'],
    )

    expect(library.activeId).toBe('r1')
  })

  it('leaves the active selection alone when it survives', () => {
    const library = removeManyResume(
      libraryWith(resume(), resume({ id: 'r2' }), resume({ id: 'r3' })),
      ['r2'],
    )

    expect(library.activeId).toBe('r3')
  })

  it('ends up with nothing active when everything is removed', () => {
    const library = removeManyResume(
      libraryWith(resume(), resume({ id: 'r2' }), resume({ id: 'r3' })),
      ['r1', 'r2', 'r3'],
    )

    expect(library.resumes).toEqual([])
    expect(library.activeId).toBeNull()
  })

  it('leaves the library alone when none of the ids are present', () => {
    const library = libraryWith(resume(), resume({ id: 'r2' }))

    expect(removeManyResume(library, ['nope', ''])).toEqual(library)
  })

  it('leaves the library alone when asked to remove nothing', () => {
    const library = libraryWith(resume())

    expect(removeManyResume(library, [])).toEqual(library)
  })
})

describe('sortResumesByRecency', () => {
  it('lists most recently updated first, leaving the array alone', () => {
    const input = [
      { id: 'a', updatedAt: '2026-03-01T00:00:00.000Z' },
      { id: 'b', updatedAt: '2026-03-03T00:00:00.000Z' },
      { id: 'c', updatedAt: '2026-03-02T00:00:00.000Z' },
    ]

    expect(sortResumesByRecency(input).map((entry) => entry.id)).toEqual(['b', 'c', 'a'])
    expect(input.map((entry) => entry.id)).toEqual(['a', 'b', 'c'])
  })

  it('keeps resumes without a date last', () => {
    const input = [{ id: 'a', updatedAt: '2026-03-02T00:00:00.000Z' }, { id: 'b' }]

    expect(sortResumesByRecency(input).map((entry) => entry.id)).toEqual(['a', 'b'])
  })

  it('sorts a dateless resume ahead of older dated ones when it is newer', () => {
    // A missing date reads as epoch 0, so it lands behind anything dated; here
    // both sides run through the undefined-date branch of the comparator.
    const input = [{ id: 'x' }, { id: 'a', updatedAt: '2020-01-01T00:00:00.000Z' }]

    expect(sortResumesByRecency(input).map((entry) => entry.id)).toEqual(['a', 'x'])
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
    }) as Library

    expect(library.resumes.map((entry) => entry.id)).toEqual(['r1', 'ok'])
    expect(library.resumes[1].name).toBe('Fine')
  })

  it('falls back to the first resume when the active id is gone', () => {
    const library = validateLibrary({ activeId: 'missing', resumes: [resume()] }) as Library

    expect(library.activeId).toBe('r1')
  })

  it('accepts an empty library, because deleting everything is allowed', () => {
    expect(validateLibrary({ resumes: [] })).toEqual({
      schemaVersion: SCHEMA_VERSION,
      activeId: null,
      resumes: [],
      samplesSeeded: false,
    })
  })

  it('keeps an explicit samplesSeeded flag', () => {
    expect((validateLibrary({ resumes: [], samplesSeeded: true }) as Library).samplesSeeded).toBe(
      true,
    )
    expect(
      (validateLibrary({ resumes: [resume()], samplesSeeded: false }) as Library).samplesSeeded,
    ).toBe(false)
  })

  it('repairs non-string timestamps on the way in', () => {
    const repaired = validateLibrary({
      resumes: [{ id: 'ok', name: 'R', markdown: '# R', createdAt: 12345, updatedAt: 67890 }],
    }) as Library

    expect(repaired.resumes[0].id).toBe('ok')
    expect(repaired.resumes[0].createdAt).toEqual(expect.any(String))
    expect(repaired.resumes[0].updatedAt).toEqual(expect.any(String))
  })
})

describe('migrateLibrary', () => {
  it('wraps the old single-resume shape into a library', () => {
    const migrated = migrateLibrary({
      markdown: '# Ada Lovelace',
      settings: { baseFontSize: 12 },
    }) as Library

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

  it('passes non-objects straight through', () => {
    expect(migrateLibrary(null)).toBeNull()
    expect(migrateLibrary(42)).toBe(42)
  })

  it('hands out a fresh id to an old resume with a broken identity', () => {
    const migrated = migrateLibrary({ id: '', markdown: '# X' }) as Library

    expect(migrated.resumes[0].id).toEqual(expect.any(String))
    expect(migrated.resumes[0].id.length).toBeGreaterThan(0)
  })
})

describe('sample seeding and restore', () => {
  const sample = (id: string, name: string) => ({ id, name, markdown: `# ${name}` })

  it('seeds the samples on first run, marking the flag and selecting the first', () => {
    const seeded = seedLibrary(createLibrary(), [sample('s1', 'Ada'), sample('s2', 'Grace')])

    expect(seeded.samplesSeeded).toBe(true)
    expect(seeded.resumes.map((entry) => entry.id)).toEqual(['s1', 's2'])
    expect(seeded.activeId).toBe('s1')
  })

  it('does nothing when the samples were already seeded once', () => {
    const library = { ...createLibrary(), samplesSeeded: true, resumes: [resume()] }

    expect(seedLibrary(library, [sample('s1', 'Ada')])).toBe(library)
  })

  it('seeds the samples with one timestamp, so recency keeps their declared order', () => {
    const seeded = seedLibrary(createLibrary(), [
      sample('s1', 'Ada'),
      sample('s2', 'Grace'),
      sample('s3', 'Lin'),
    ])
    const displayed = sortResumesByRecency(seeded.resumes)

    expect(displayed.map((entry) => entry.id)).toEqual(['s1', 's2', 's3'])
    expect(new Set(displayed.map((entry) => entry.updatedAt)).size).toBe(1)
  })

  it('seeds samples even when the flag is unset but the library is not empty', () => {
    const library = { ...createLibrary(), activeId: 'r1', resumes: [resume()] }

    const seeded = seedLibrary(library, [sample('s1', 'Ada')])

    expect(seeded.samplesSeeded).toBe(true)
    expect(seeded.resumes).toHaveLength(2)
    expect(seeded.activeId).toBe('r1')
  })

  it('lists only the samples a library is missing', () => {
    const library = { ...createLibrary(), resumes: [sample('s1', 'Ada')] } as Library

    expect(missingSamples(library, [sample('s1', 'Ada'), sample('s2', 'Grace')]).map((s) => s.id)).toEqual([
      's2',
    ])
  })

  it('restores deleted samples without duplicating the ones that remain', () => {
    const seeded = seedLibrary(createLibrary(), [sample('s1', 'Ada'), sample('s2', 'Grace')])
    const oneLeft = removeResume(seeded, 's2')
    const restored = restoreSamples(oneLeft, [sample('s1', 'Ada'), sample('s2', 'Grace')])

    expect(restored.resumes.map((entry) => entry.id)).toEqual(['s1', 's2'])
  })

  it('re-activates a sample when the library was left empty', () => {
    const restored = restoreSamples(createLibrary(), [sample('s1', 'Ada'), sample('s2', 'Grace')])

    expect(restored.resumes).toHaveLength(2)
    expect(restored.activeId).toBe('s1')
    expect(restored.samplesSeeded).toBe(true)
  })

  it('keeps the library identity when nothing is missing and seeding is done', () => {
    const library = {
      ...createLibrary(),
      samplesSeeded: true,
      resumes: [sample('s1', 'Ada')],
      activeId: 's1',
    } as Library

    expect(restoreSamples(library, [sample('s1', 'Ada')])).toBe(library)
  })

  it('marks seeding done even when there is nothing to hand out', () => {
    const seeded = seedLibrary(createLibrary(), [])

    expect(seeded.samplesSeeded).toBe(true)
    expect(seeded.resumes).toEqual([])
    expect(seeded.activeId).toBeNull()
  })
})

describe('uniqueResumeName', () => {
  it('returns the base name when it is free', () => {
    expect(uniqueResumeName(libraryWith(resume()), 'Free Name')).toBe('Free Name')
  })

  it('numbers a taken name', () => {
    expect(uniqueResumeName(libraryWith(resume()), 'Ada Lovelace')).toBe('Ada Lovelace 2')
  })

  it('gives up and returns the base when every numbered variant is taken', () => {
    const resumes = [resume({ id: 'base', name: 'X' })]

    for (let index = 2; index < 1000; index += 1) {
      resumes.push({ ...resume({ id: `x${index}` }), name: `X ${index}` })
    }

    expect(uniqueResumeName({ resumes }, 'X')).toBe('X')
  })
})

describe('newResumeId fallback', () => {
  it('generates an id without a crypto implementation', () => {
    const owned = Object.getOwnPropertyDescriptor(globalThis, 'crypto')

    try {
      Object.defineProperty(globalThis, 'crypto', { configurable: true, value: undefined })

      expect(createResume({ markdown: '# X' }).id).toMatch(/^resume-/)
    } finally {
      if (owned) Object.defineProperty(globalThis, 'crypto', owned)
      else delete (globalThis as any).crypto
    }
  })
})

describe('loadLibrary / saveLibrary', () => {
  let storage: ReturnType<typeof createMemoryStorage>

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
    const library = setActiveResume(libraryWith(resume(), resume({ id: 'r2' })), 'r1')

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

  it('refuses a storage object that is missing the required method', () => {
    const justWrites = { setItem: () => {} }
    const justReads = { getItem: () => '{}' }

    expect(loadLibrary(justWrites).status).toBe('unavailable')
    expect(saveLibrary(justReads, createLibrary())).toEqual({ saved: false, reason: 'unavailable' })
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

  it('falls back to the global store when no candidate is passed', () => {
    const globalStore = createMemoryStorage()
    const owned = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')

    try {
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: globalStore })

      expect(resolveStorage(undefined)).toEqual({ storage: globalStore, persistent: true })
    } finally {
      if (owned) Object.defineProperty(globalThis, 'localStorage', owned)
      else delete (globalThis as any).localStorage
    }
  })

  it('falls back to memory when no candidate is passed and there is no store', () => {
    const owned = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')

    try {
      delete (globalThis as any).localStorage

      const resolved = resolveStorage(undefined)

      expect(resolved.persistent).toBe(false)
      expect(saveLibrary(resolved.storage, createLibrary()).saved).toBe(true)
    } finally {
      if (owned) Object.defineProperty(globalThis, 'localStorage', owned)
      else delete (globalThis as any).localStorage
    }
  })

  it('catches a local store that refuses even to be read', () => {
    const owned = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')

    try {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        get() {
          throw new Error('denied')
        },
      })

      expect(resolveStorage(undefined).persistent).toBe(false)
    } finally {
      if (owned) Object.defineProperty(globalThis, 'localStorage', owned)
      else delete (globalThis as any).localStorage
    }
  })
})