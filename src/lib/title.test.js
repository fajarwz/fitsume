import { describe, expect, it } from 'vitest'

import { deriveTitle } from './title.js'

describe('deriveTitle', () => {
  it('returns the name from the first level-1 heading', () => {
    expect(deriveTitle('# Aisyah Nurhidayah\nSoftware Engineering Graduate\nBandung')).toBe(
      'Aisyah Nurhidayah',
    )
  })

  it('finds the level-1 heading even when it is not the first line', () => {
    const markdown = '\n\n## EXPERIENCE\n### Engineer — Acme\n# Rizky Pratama\n'

    expect(deriveTitle(markdown)).toBe('Rizky Pratama')
  })

  it('ignores deeper headings', () => {
    expect(deriveTitle('## EXPERIENCE\n- did things')).toBe('Resume')
    expect(deriveTitle('### Engineer — Acme')).toBe('Resume')
  })

  it('falls back when there is no heading at all', () => {
    expect(deriveTitle('')).toBe('Resume')
    expect(deriveTitle('   ')).toBe('Resume')
    expect(deriveTitle('- just a bullet')).toBe('Resume')
  })

  it('falls back for an empty heading, and never leaks the next line into the title', () => {
    expect(deriveTitle('#   \nrest of the document')).toBe('Resume')
    expect(deriveTitle('#\nrest of the document')).toBe('Resume')
    expect(deriveTitle('#\t\nrest')).toBe('Resume')
  })

  it('trims surrounding whitespace', () => {
    expect(deriveTitle('#  Fatima al-Fihri  \nFounder')).toBe('Fatima al-Fihri')
  })

  it('does not confuse a heading with a horizontal rule or a bullet', () => {
    expect(deriveTitle('#---\n#real title')).toBe('Resume')
  })

  it('is defensive about non-string input', () => {
    expect(deriveTitle(undefined)).toBe('Resume')
    expect(deriveTitle(null)).toBe('Resume')
    expect(deriveTitle(42)).toBe('Resume')
  })
})
