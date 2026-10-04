import { describe, expect, it } from 'vitest'

import { findAddresses, findLabels, hasLink, hrefFor, segmentsFrom, splitLinks } from './links.js'

describe('hrefFor', () => {
  it('returns null for non-string or empty input', () => {
    expect(hrefFor(undefined)).toBeNull()
    expect(hrefFor(42)).toBeNull()
    expect(hrefFor('')).toBeNull()
  })

  it('wraps an email in a mailto link', () => {
    expect(hrefFor('rizky@example.com')).toBe('mailto:rizky@example.com')
  })

  it('returns a full URL unchanged', () => {
    expect(hrefFor('https://example.com')).toBe('https://example.com')
    expect(hrefFor('http://x.io/path')).toBe('http://x.io/path')
  })

  it('prepends https:// to a bare domain', () => {
    expect(hrefFor('example.com')).toBe('https://example.com')
    expect(hrefFor('www.sub.example.dev/path')).toBe('https://www.sub.example.dev/path')
  })

  it('returns null when nothing is recognised', () => {
    expect(hrefFor('plain text')).toBeNull()
    expect(hrefFor('https://')).toBeNull()
  })
})

describe('findAddresses', () => {
  it('returns [] for empty or non-string input', () => {
    expect(findAddresses('')).toEqual([])
    expect(findAddresses(undefined)).toEqual([])
  })

  it('returns [] for text with no addresses and no recognised links', () => {
    expect(findAddresses('just a plain sentence')).toEqual([])
  })

  it('finds an email, a URL, and a bare domain in one line', () => {
    expect(findAddresses('mail rizky@example.com at https://fitty.com or fitty.dev')).toEqual([
      { start: 5, end: 22, href: 'mailto:rizky@example.com' },
      { start: 26, end: 43, href: 'https://fitty.com' },
      { start: 47, end: 56, href: 'https://fitty.dev' },
    ])
  })

  it('strips trailing sentence punctuation from a matched address', () => {
    expect(findAddresses('email a@b.co!) or visit example.dev,'))
      .toEqual([
        { start: 6, end: 12, href: 'mailto:a@b.co' },
        { start: 24, end: 35, href: 'https://example.dev' },
      ])
  })

  it('skips a matched URL that is empty once punctuation is stripped', () => {
    expect(findAddresses('see https://) now')).toEqual([])
  })
})

describe('findLabels', () => {
  it('returns [] for empty or non-string input', () => {
    expect(findLabels('')).toEqual([])
    expect(findLabels(undefined)).toEqual([])
  })

  it('returns [] when there are no labels', () => {
    expect(findLabels('any text', undefined, 'any text')).toEqual([])
    expect(findLabels('any text', null, 'any text')).toEqual([])
  })

  it('uses the label offset when the whole block is the line', () => {
    const labels = [{ start: 3, text: 'rizky@example.com', href: 'mailto:rizky@example.com' }]

    expect(findLabels('Hi rizky@example.com there', labels, 'Hi rizky@example.com there')).toEqual([
      { start: 3, end: 20, href: 'mailto:rizky@example.com' },
    ])
  })

  it('falls back to a text search when the line is only part of the block', () => {
    const labels = [{ start: 0, text: 'Website', href: 'https://example.com' }]

    expect(findLabels('Our Website', labels, 'A longer block with Our Website at the end')).toEqual([
      { start: 4, end: 11, href: 'https://example.com' },
    ])
  })

  it('falls back to a text search when the label has no start offset', () => {
    const labels = [{ text: 'GitHub', href: 'https://github.com' }]

    expect(findLabels('Link to GitHub', labels, 'Link to GitHub')).toEqual([
      { start: 8, end: 14, href: 'https://github.com' },
    ])
  })

  it('skips a label whose text is not present at its offset', () => {
    const labels = [{ start: 0, text: 'Gone', href: 'https://example.com' }]

    expect(findLabels('no such word', labels, 'no such word')).toEqual([])
  })

  it('skips a label that the line no longer contains', () => {
    const labels = [{ start: 0, text: 'Missing', href: 'https://x.io' }]

    expect(findLabels('different line', labels, 'A much longer original block')).toEqual([])
  })
})

describe('segmentsFrom', () => {
  it('returns [] for empty or non-string input', () => {
    expect(segmentsFrom('')).toEqual([])
    expect(segmentsFrom(undefined)).toEqual([])
  })

  it('keeps plain text as a single run', () => {
    expect(segmentsFrom('hello', [])).toEqual([{ text: 'hello', href: null }])
  })

  it('slices around matches and fills gaps with plain runs', () => {
    expect(
      segmentsFrom(
        'a@b.co no https://x.io',
        [{ start: 0, end: 6, href: 'mailto:a@b.co' }],
        [{ start: 10, end: 22, href: 'https://x.io' }],
      ),
    ).toEqual([
      { text: 'a@b.co', href: 'mailto:a@b.co' },
      { text: ' no ', href: null },
      { text: 'https://x.io', href: 'https://x.io' },
    ])
  })

  it('drops later matches that overlap an earlier one and keeps the trailing run', () => {
    expect(
      segmentsFrom(
        'abcdef',
        [{ start: 1, end: 4, href: 'https://a.io' }],
        [{ start: 2, end: 5, href: 'https://b.io' }],
      ),
    ).toEqual([
      { text: 'a', href: null },
      { text: 'bcd', href: 'https://a.io' },
      { text: 'ef', href: null },
    ])
  })
})

describe('splitLinks', () => {
  it('splits a line on its written-out addresses', () => {
    expect(splitLinks('mail a@b.co! then https://x.io')).toEqual([
      { text: 'mail ', href: null },
      { text: 'a@b.co', href: 'mailto:a@b.co' },
      { text: '! then ', href: null },
      { text: 'https://x.io', href: 'https://x.io' },
    ])
  })
})

describe('hasLink', () => {
  it('is true when any run is clickable', () => {
    expect(hasLink([{ text: 'x', href: null }, { text: 'y', href: 'https://x.io' }])).toBe(true)
  })

  it('is false when no run is clickable', () => {
    expect(hasLink([{ text: 'x', href: null }])).toBe(false)
    expect(hasLink([])).toBe(false)
  })
})