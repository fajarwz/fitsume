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
    expect(lengths).toContain('dense')
    expect(lengths).toContain('long') // must clamp and warn, never clip
  })

  it('keeps modern samples fictional, on example.com', () => {
    for (const sample of samplesByCategory('modern')) {
      expect(sample.markdown).toContain('example.com')
    }
  })

  it('keeps historical samples free of an invented first-person voice', () => {
    for (const sample of samplesByCategory('historical')) {
      // The summary paragraph is the line after the metadata line; a historical
      // sample must not put words in a real person's mouth.
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
