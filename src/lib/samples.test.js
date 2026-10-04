import { describe, expect, it } from 'vitest'

import {
  DEFAULT_SAMPLE_ID,
  SAMPLES,
  SAMPLE_CATEGORIES,
  getSample,
  samplesByCategory,
} from './samples.js'
import { deriveTitle } from './title.js'

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
    expect(getSample(DEFAULT_SAMPLE_ID).id).toBe(DEFAULT_SAMPLE_ID)
  })

  it('returns null for an unknown sample id', () => {
    expect(getSample('nope')).toBeNull()
    expect(getSample(undefined)).toBeNull()
  })
})
