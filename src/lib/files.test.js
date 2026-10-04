import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  MERGE_MODES,
  downloadText,
  exportLibraryJson,
  exportResumeMarkdown,
  libraryFilename,
  markdownFilename,
  mergeLibraries,
  parseLibraryJson,
  resumeFromMarkdown,
  slugify,
} from './files.js'
import { createLibrary, createResume } from './stash.js'

const NOW = new Date('2026-03-04T05:06:07.000Z')

const resume = (overrides = {}) =>
  createResume({ id: 'r1', name: 'Ada Lovelace', markdown: '# Ada Lovelace', ...overrides })

describe('naming files', () => {
  it('turns a resume name into a filename someone can recognise', () => {
    expect(slugify('Ada Lovelace')).toBe('ada-lovelace')
    expect(slugify('Rizky Pratama — Senior Engineer')).toBe('rizky-pratama-senior-engineer')
  })

  it('strips accents rather than dropping the letters', () => {
    expect(slugify('Ñoño Álvarez')).toBe('nono-alvarez')
  })

  it('never produces an empty or hazardous filename', () => {
    expect(slugify('')).toBe('resume')
    expect(slugify('   ...   ')).toBe('resume')
    expect(slugify('../../etc/passwd')).toBe('etc-passwd')
  })

  it('caps the length', () => {
    expect(slugify('a'.repeat(200)).length).toBeLessThanOrEqual(60)
  })

  it('dates the library backup so older copies are recognisable', () => {
    expect(markdownFilename('Ada Lovelace')).toBe('ada-lovelace.md')
    expect(libraryFilename(NOW)).toBe('fitsume-resumes-2026-03-04.json')
  })
})

describe('markdown round trip', () => {
  it('ends the file with a newline', () => {
    expect(exportResumeMarkdown({ markdown: '# Ada' })).toBe('# Ada\n')
    expect(exportResumeMarkdown({ markdown: '# Ada\n' })).toBe('# Ada\n')
    expect(exportResumeMarkdown({ markdown: '' })).toBe('')
  })

  it('imports a file as a resume named after the file', () => {
    const imported = resumeFromMarkdown('# Ada Lovelace\nMathematician', { filename: 'my-cv.md' })

    expect(imported.name).toBe('my cv')
    expect(imported.markdown).toContain('Ada Lovelace')
    expect(imported.id).toBeTruthy()
  })

  it('falls back to the heading inside the file when there is no filename', () => {
    expect(resumeFromMarkdown('# Grace Hopper').name).toBe('Grace Hopper')
  })

  it('accepts an empty import without inventing a document', () => {
    expect(resumeFromMarkdown('').markdown).toBe('')
  })

  it('treats a non-string import as an empty document', () => {
    expect(resumeFromMarkdown(null).markdown).toBe('')
    expect(resumeFromMarkdown(undefined).markdown).toBe('')
    expect(resumeFromMarkdown({}).markdown).toBe('')
  })

  it('drops a filename that collapses to nothing, falling back to the heading', () => {
    expect(resumeFromMarkdown('# Hello', { filename: '___' }).name).toBe('Hello')
    expect(resumeFromMarkdown('# Hello', { filename: '-_-' }).name).toBe('Hello')
  })
})

describe('library backup', () => {
  const library = { ...createLibrary(), resumes: [resume()], activeId: 'r1' }

  it('serialises with a timestamp, so backups can be told apart', () => {
    const parsed = JSON.parse(exportLibraryJson(library, { now: NOW }))

    expect(parsed.exportedAt).toBe(NOW.toISOString())
    expect(parsed.resumes).toHaveLength(1)
  })

  it('reads back what it wrote', () => {
    const { library: restored, status } = parseLibraryJson(exportLibraryJson(library, { now: NOW }))

    expect(status).toBe('ok')
    expect(restored.resumes[0].id).toBe('r1')
  })

  it('rejects a file that is not JSON, and one that is JSON of the wrong shape', () => {
    expect(parseLibraryJson('not json at all')).toEqual({ library: null, status: 'corrupt' })
    expect(parseLibraryJson('{"hello":"there"}')).toEqual({ library: null, status: 'corrupt' })
    expect(parseLibraryJson('{"resumes":"nope"}')).toEqual({ library: null, status: 'corrupt' })
  })
})

describe('mergeLibraries', () => {
  const current = { ...createLibrary(), resumes: [resume()], activeId: 'r1' }

  it('adds what is missing and keeps what is there', () => {
    const incoming = { ...createLibrary(), resumes: [resume({ id: 'r2', name: 'Grace Hopper' })] }
    const merged = mergeLibraries(current, incoming)

    expect(merged.resumes.map((entry) => entry.name)).toEqual(['Ada Lovelace', 'Grace Hopper'])
    expect(merged.activeId).toBe('r2')
  })

  it('gives a colliding resume a new id instead of overwriting the one in use', () => {
    const incoming = {
      ...createLibrary(),
      resumes: [resume({ markdown: '# Ada Lovelace\n\nan older draft' })],
    }
    const merged = mergeLibraries(current, incoming)

    expect(merged.resumes).toHaveLength(2)
    expect(merged.resumes[1].id).not.toBe('r1')
    expect(merged.resumes[0].markdown).toBe('# Ada Lovelace')
  })

  it('renames a duplicate name rather than ending up with two of them', () => {
    const incoming = { ...createLibrary(), resumes: [resume({ id: 'r9' })] }
    const merged = mergeLibraries(current, incoming)

    expect(merged.resumes.map((entry) => entry.name)).toEqual(['Ada Lovelace', 'Ada Lovelace 2'])
  })

  it('replaces everything when asked to', () => {
    const incoming = { ...createLibrary(), resumes: [resume({ id: 'r2', name: 'Grace Hopper' })] }
    const merged = mergeLibraries(current, incoming, { mode: MERGE_MODES.replace })

    expect(merged.resumes.map((entry) => entry.name)).toEqual(['Grace Hopper'])
  })

  it('keeps the incoming active id on a replace', () => {
    const incoming = {
      ...createLibrary(),
      resumes: [resume({ id: 'r2', name: 'Grace Hopper' })],
      activeId: 'r2',
    }
    const merged = mergeLibraries(current, incoming, { mode: MERGE_MODES.replace })

    expect(merged.activeId).toBe('r2')
  })

  it('keeps the current library when the incoming file has no resumes to add', () => {
    const merged = mergeLibraries(current, { ...createLibrary(), resumes: [] })

    expect(merged.activeId).toBe('r1')
    expect(merged.resumes).toHaveLength(1)
    expect(merged.resumes[0].id).toBe('r1')
  })

  it('leaves the library alone when the file cannot be read', () => {
    expect(mergeLibraries(current, { nonsense: true })).toBe(current)
  })
})

describe('downloadText', () => {
  let click

  beforeEach(() => {
    document.body.innerHTML = ''
    click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  it('hands the browser a download and takes the link back out', () => {
    downloadText({ filename: 'ada.md', text: '# Ada' })

    expect(click).toHaveBeenCalledTimes(1)
    expect(document.querySelector('a[download]')).toBeNull()
  })

  it('falls back to a data URL when the browser has no object URLs', () => {
    const observed = []
    const win = { URL: undefined, Blob: undefined }

    downloadText({
      filename: 'ada.md',
      text: '# Ada',
      win,
      doc: {
        body: { appendChild: (node) => observed.push(node) },
        createElement: () => ({ click: () => {}, style: {}, remove: () => {} }),
      },
    })

    expect(observed[0].href.startsWith('data:text/markdown')).toBe(true)
    expect(observed[0].download).toBe('ada.md')
  })

  it('uses an object URL when it can, and revokes it afterwards', () => {
    const revokeObjectURL = vi.fn()
    const win = {
      Blob: globalThis.Blob,
      URL: { createObjectURL: () => 'blob:fake-url', revokeObjectURL },
    }

    downloadText({ filename: 'ada.md', text: '# Ada', win })

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')
  })

  it('does nothing when there is no document to download into', () => {
    expect(downloadText({ filename: 'ada.md', text: '# Ada', doc: null })).toBe(false)
  })
})
