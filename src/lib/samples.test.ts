import { describe, expect, it } from 'vitest'

import {
  DEFAULT_SAMPLE_ID,
  SAMPLES,
  SAMPLE_CATEGORIES,
  SAMPLE_ORDER,
  SAMPLE_RESUME_PREFIX,
  getSample,
  hasOnlySampleResumes,
  isSampleResume,
  sampleResumeId,
  sampleResumes,
  samplesByCategory,
} from './samples.ts'
import { deriveTitle } from './title.ts'

describe('samples', () => {
  it('has unique ids', () => {
    const ids = SAMPLES.map((sample) => sample.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('uses only declared categories', () => {
    const declared = SAMPLE_CATEGORIES.map((category) => category.id)

    for (const sample of SAMPLES) {
      expect(declared).toContain(sample.category)
    }
  })

  it('has at least one sample per category', () => {
    for (const category of SAMPLE_CATEGORIES) {
      expect(samplesByCategory(category.id).length).toBeGreaterThan(0)
    }
  })

  it('starts every sample with a level-1 heading, so the title is derivable', () => {
    for (const sample of SAMPLES) {
      const firstLine = sample.markdown.split('\n')[0]

      expect(firstLine.startsWith('# ')).toBe(true)
      expect(deriveTitle(sample.markdown)).not.toBe('Resume')
      expect(sample.markdown).not.toContain('Milo') // inherited demo data must not sneak back in
    }
  })

  it('covers every length the auto-fit matrix needs', () => {
    const lengths = new Set(SAMPLES.map((sample) => sample.length))

    expect(lengths).toContain('minimal') // font grows up to the cap
    expect(lengths).toContain('normal')
    expect(lengths).toContain('long') // the fullest one-pager the set ships
  })

  it('says what every modern sample is built from, and where', () => {
    for (const sample of samplesByCategory('modern')) {
      expect(sample.note, `${sample.id} has no note`).toBeTruthy()
      expect(sample.source, `${sample.id} has no source`).toMatch(/^https:\/\//)
    }
  })

  it('puts no invented contact details on a real person', () => {
    for (const sample of SAMPLES) {
      // A fabricated email address on a real person is a different class of error
      // from a fabricated bullet, so there are none anywhere in the set.
      expect(sample.markdown, `${sample.id} carries contact details`).not.toMatch(
        /@[a-z0-9.-]+\.[a-z]{2,}|example\.com|https?:\/\//i,
      )
    }
  })

  it('keeps every sample free of an invented first-person voice', () => {
    for (const sample of SAMPLES) {
      // These are real people: a sample must not put words in their mouth.
      expect(sample.markdown).not.toMatch(/\nI [a-z]/)
    }
  })

  it('resolves the default sample', () => {
    expect(getSample(DEFAULT_SAMPLE_ID)).not.toBeNull()
    expect(getSample(DEFAULT_SAMPLE_ID)!.id).toBe(DEFAULT_SAMPLE_ID)
  })

  it('returns null for an unknown sample id', () => {
    expect(getSample('nope')).toBeNull()
    expect(getSample(undefined)).toBeNull()
  })

  it('seeds a stable prefixed resume id from the id', () => {
    for (const sample of SAMPLES) {
      expect(sampleResumeId(sample)).toBe(`${SAMPLE_RESUME_PREFIX}${sample.id}`)
    }
  })

  it('recognises only prefixed ids as sample resumes', () => {
    expect(isSampleResume({ id: `${SAMPLE_RESUME_PREFIX}al-khwarizmi` })).toBe(true)
    expect(isSampleResume({ id: 'editorial' })).toBe(false)
    // A missing id must short-circuit to false instead of throwing.
    expect(isSampleResume({})).toBe(false)
    expect(isSampleResume({ id: 42 })).toBe(false)
    expect(isSampleResume(null)).toBe(false)
  })

  it('turns every sample into a library record in display order', () => {
    const resumes = sampleResumes()

    expect(resumes).toHaveLength(SAMPLE_ORDER.length)
    expect(SAMPLE_ORDER).toEqual(['bj-habibie', 'al-khwarizmi', 'fatima-al-fihri'])
    expect(resumes.map((resume) => resume.id)).toEqual(
      SAMPLE_ORDER.map((id) => `${SAMPLE_RESUME_PREFIX}${id}`),
    )

    for (const resume of resumes) {
      expect(resume.markdown).toBeTruthy()
      expect(resume.id.startsWith(SAMPLE_RESUME_PREFIX)).toBe(true)
      // Restore can tell a row began life as a sample.
      expect(isSampleResume(resume)).toBe(true)
    }
  })

  it('knows when the library holds nothing but the seeded samples', () => {
    const [habibie, ...others] = sampleResumes()

    expect(hasOnlySampleResumes(sampleResumes())).toBe(true)
    expect(hasOnlySampleResumes([habibie])).toBe(true)
    expect(hasOnlySampleResumes([...others, { id: 'mine', markdown: '# Me' }])).toBe(false)
    expect(hasOnlySampleResumes([{ id: 'mine', markdown: '# Me' }])).toBe(false)
    // An empty library is a blank slate, not the seeded-samples onboarding state.
    expect(hasOnlySampleResumes([])).toBe(false)
  })
})