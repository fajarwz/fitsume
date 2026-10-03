import { describe, expect, it } from 'vitest'

import { createTextMetrics } from './textMetrics.js'

/**
 * jsdom has no font engine: `canvas.getContext('2d')` returns null, and pretext
 * needs it to read glyph advances. So the real adapter can only be exercised
 * where a canvas exists. The alternative — mocking the engine and asserting
 * against the mock — would prove nothing, so these tests skip instead, and the
 * real measurement path is verified in a browser.
 */
const hasCanvas = (() => {
  try {
    if (typeof document === 'undefined') return false

    return Boolean(document.createElement('canvas').getContext('2d'))
  } catch {
    return false
  }
})()

describe('createTextMetrics (without a canvas)', () => {
  it('reports nothing measured for an empty string rather than calling the engine', () => {
    const metrics = createTextMetrics()

    expect(metrics.measure('', { font: '12px Inter' })).toEqual({ height: 0, lineCount: 0 })
    expect(metrics.lines('', { font: '12px Inter' })).toEqual({
      height: 0,
      lineCount: 0,
      lines: [],
    })
  })

  it('starts with an empty cache', () => {
    expect(createTextMetrics().stats).toMatchObject({ hits: 0, misses: 0, size: 0 })
  })
})

describe.skipIf(!hasCanvas)('createTextMetrics (with a real canvas)', () => {
  it('measures a line of text as taller than zero', () => {
    const metrics = createTextMetrics()

    const { height, lineCount } = metrics.measure('A short line of text', {
      font: '12px sans-serif',
      maxWidth: 300,
      lineHeight: 16,
    })

    expect(lineCount).toBeGreaterThan(0)
    expect(height).toBeGreaterThan(0)
  })

  it('returns more lines as the width shrinks', () => {
    const metrics = createTextMetrics()
    const text = 'A sentence long enough that it has to wrap when the column gets narrow.'

    const wide = metrics.measure(text, { font: '12px sans-serif', maxWidth: 600, lineHeight: 16 })
    const narrow = metrics.measure(text, { font: '12px sans-serif', maxWidth: 120, lineHeight: 16 })

    expect(narrow.lineCount).toBeGreaterThan(wide.lineCount)
  })

  it('reuses prepared handles from the cache on a repeat call', () => {
    const metrics = createTextMetrics()

    metrics.measure('Cached text', { font: '12px sans-serif', maxWidth: 300, lineHeight: 16 })
    metrics.measure('Cached text', { font: '12px sans-serif', maxWidth: 300, lineHeight: 16 })

    expect(metrics.stats.hits).toBe(1)
    expect(metrics.stats.misses).toBe(1)
  })

  it('agrees with itself between the measure path and the render path', () => {
    const metrics = createTextMetrics()
    const args = { font: '12px sans-serif', maxWidth: 200, lineHeight: 16 }
    const text = 'The same line breaking has to be used for measuring and for rendering.'

    const measured = metrics.measure(text, args)
    const rendered = metrics.lines(text, args)

    expect(rendered.height).toBeCloseTo(measured.height, 6)
    expect(rendered.lines).toHaveLength(measured.lineCount)
  })
})
