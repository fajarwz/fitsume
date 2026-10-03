import { describe, expect, it } from 'vitest'

import { createFakeMetrics } from '../test/fakeMetrics.js'
import { findOptimalFit, largestFontSizeThatFits, overflowBy } from './fit.js'
import { measureBlocks } from './measure.js'
import { parseMarkdown } from './markdown.js'
import {
  DEFAULT_PADDING,
  DEFAULT_SPACING,
  FONT_SIZE_MIN,
  LINE_HEIGHT_MAX,
  LINE_HEIGHT_MIN,
  PAGE_HEIGHT,
  PAGE_WIDTH,
} from './page.js'

const MAX_FONT_SIZE = 14

const options = (metrics, overrides = {}) => ({
  metrics,
  contentWidth: PAGE_WIDTH - DEFAULT_PADDING * 2,
  maxHeight: PAGE_HEIGHT - DEFAULT_PADDING * 2,
  spacing: DEFAULT_SPACING,
  maxFontSize: MAX_FONT_SIZE,
  ...overrides,
})

const heightAt = (blocks, opts, baseFontSize, lineHeightMultiplier) =>
  measureBlocks(blocks, { ...opts, baseFontSize, lineHeightMultiplier })

/** So little content that it fits at any size the search will try. */
const tiny = () => parseMarkdown('# Name\nRole\nJakarta')

/** A real one-pager: fits, with an interior solution worth asserting on. */
const medium = () =>
  parseMarkdown(
    [
      '# Someone With A Real Resume',
      'Senior Engineer',
      'Jakarta · someone@example.com',
      '---',
      'A summary paragraph that takes a line or two to get through properly.',
      '## EXPERIENCE',
      '### Senior Engineer — Nusantara Labs',
      '2021 – Present',
      '- Cut p99 latency from 850ms to 140ms across the payments path',
      '- Designed the idempotency layer that ended double charges for good',
      '## SKILLS',
      'Go · PostgreSQL · Kafka · Kubernetes · Terraform',
    ].join('\n'),
  )

/**
 * Enough content that the largest font size is a real interior solution: it
 * overflows at 24px, still fits at the 6px floor.
 */
const dense = () => {
  const bullets = Array.from(
    { length: 60 },
    (_, index) => `- Achievement number ${index} with enough words in it to wrap on a narrow line`,
  )

  return parseMarkdown(
    ['# Dense', 'Senior Engineer', 'Jakarta', '## EXPERIENCE', ...bullets].join('\n'),
  )
}

/** Nothing fits, not even at the floor. */
const absurdlyLong = () => {
  const bullets = Array.from(
    { length: 220 },
    (_, index) => `- Achievement number ${index} with enough words in it to wrap on a narrow line`,
  )

  return parseMarkdown(
    ['# Overflow', 'Too Much Content', 'Jakarta', '## EXPERIENCE', ...bullets].join('\n'),
  )
}

describe('findOptimalFit', () => {
  it('returns typography that actually fits', () => {
    const opts = options(createFakeMetrics())

    for (const blocks of [tiny(), medium(), dense()]) {
      const fit = findOptimalFit(blocks, opts)

      expect(fit.height).toBeLessThanOrEqual(opts.maxHeight)
    }
  })

  it('returns the largest font size that fits, not merely a fitting one', () => {
    const opts = options(createFakeMetrics(), { maxFontSize: 24 })
    const blocks = dense()
    const { fontSize, lineHeightMultiplier } = findOptimalFit(blocks, opts)

    expect(fontSize).toBeGreaterThan(FONT_SIZE_MIN)
    expect(fontSize).toBeLessThan(24)
    expect(heightAt(blocks, opts, fontSize + 0.05, lineHeightMultiplier)).toBeGreaterThan(
      opts.maxHeight,
    )
  })

  it('scales a short document up to the user’s maximum font size', () => {
    const opts = options(createFakeMetrics())
    const { fontSize } = findOptimalFit(tiny(), opts)

    expect(fontSize).toBeGreaterThan(MAX_FONT_SIZE - 0.1)
    expect(fontSize).toBeLessThanOrEqual(MAX_FONT_SIZE)
  })

  it('respects the maximum font size the user set', () => {
    const blocks = medium()
    const small = findOptimalFit(blocks, options(createFakeMetrics(), { maxFontSize: 9 }))
    const large = findOptimalFit(blocks, options(createFakeMetrics(), { maxFontSize: 16 }))

    expect(small.fontSize).toBeLessThanOrEqual(9)
    expect(large.fontSize).toBeLessThanOrEqual(16)
    expect(large.fontSize).toBeGreaterThan(small.fontSize)
  })

  it('floors at the minimum font size when even that overflows, rather than inventing a size', () => {
    const opts = options(createFakeMetrics())
    const blocks = absurdlyLong()
    const fit = findOptimalFit(blocks, opts)

    expect(fit.fontSize).toBe(FONT_SIZE_MIN)
    expect(fit.height).toBeGreaterThan(opts.maxHeight)
    expect(overflowBy(blocks, opts, fit.fontSize, fit.lineHeightMultiplier)).toBeGreaterThan(0)
  })

  it('keeps the line height multiplier inside its bounds', () => {
    const opts = options(createFakeMetrics())

    for (const blocks of [tiny(), medium(), dense(), absurdlyLong()]) {
      const { lineHeightMultiplier } = findOptimalFit(blocks, opts)

      expect(lineHeightMultiplier).toBeGreaterThanOrEqual(LINE_HEIGHT_MIN)
      expect(lineHeightMultiplier).toBeLessThanOrEqual(LINE_HEIGHT_MAX)
    }
  })

  it('expands the line spacing to use the space left by pass 1', () => {
    const opts = options(createFakeMetrics(), { maxFontSize: 24 })
    const blocks = dense()
    const { fontSize, lineHeightMultiplier } = findOptimalFit(blocks, opts)

    if (lineHeightMultiplier < LINE_HEIGHT_MAX) {
      // Pass 2 ran at the font size that is actually rendered, so pushing the
      // spacing any further must overflow.
      expect(heightAt(blocks, opts, fontSize, lineHeightMultiplier + 0.01)).toBeGreaterThan(
        opts.maxHeight,
      )
    } else {
      expect(lineHeightMultiplier).toBeCloseTo(LINE_HEIGHT_MAX, 2)
    }
  })

  it('expands the line spacing when the document has room to spare', () => {
    const opts = options(createFakeMetrics())
    const { lineHeightMultiplier } = findOptimalFit(tiny(), opts)

    expect(lineHeightMultiplier).toBeGreaterThan(LINE_HEIGHT_MIN)
  })

  it('reports no overflow when the document fits', () => {
    const opts = options(createFakeMetrics())
    const blocks = medium()
    const { fontSize, lineHeightMultiplier } = findOptimalFit(blocks, opts)

    expect(overflowBy(blocks, opts, fontSize, lineHeightMultiplier)).toBe(0)
  })
})

describe('largestFontSizeThatFits', () => {
  it('never returns a size below the minimum', () => {
    const opts = options(createFakeMetrics(), { minFontSize: 9, maxFontSize: 9 })

    expect(largestFontSizeThatFits(medium(), opts)).toBe(9)
  })
})
