import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as pretext from '@chenglou/pretext'

import { createTextMetrics } from './textMetrics.ts'

/**
 * The engine itself cannot run in jsdom, but the wiring around it can — and the
 * wiring is the part that was wrong before: `prepare` was re-run for the same
 * text on every block of every pass of the search.
 *
 * So these tests mock the engine and assert on how it is called. They prove the
 * cache contract, not pretext's arithmetic; the arithmetic is covered by the
 * real-canvas file and by the browser profiling run.
 */
vi.mock('@chenglou/pretext', () => ({
  prepare: vi.fn((text: string, font: string) => ({ text, font, kind: 'plain' })),
  prepareWithSegments: vi.fn((text: string, font: string) => ({ text, font, kind: 'segments' })),
  layout: vi.fn((prepared: any, _maxWidth: number, lineHeight: number) => ({
    height: lineHeight,
    lineCount: 1,
    prepared,
  })),
  layoutWithLines: vi.fn((prepared: any, maxWidth: number, lineHeight: number) => ({
    height: lineHeight,
    lineCount: 1,
    lines: [{ text: 'line', width: maxWidth }],
    prepared,
  })),
  clearCache: vi.fn(),
}))

const { clearCache, layout, layoutWithLines, prepare, prepareWithSegments } = vi.mocked(pretext)

const FONT = '11px Inter'

describe('createTextMetrics wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prepares once, then reuses the handle for the same text and font', () => {
    const metrics = createTextMetrics()

    metrics.measure('Repeat me', { font: FONT, maxWidth: 300, lineHeight: 16 })
    metrics.measure('Repeat me', { font: FONT, maxWidth: 300, lineHeight: 16 })
    metrics.measure('Repeat me', { font: FONT, maxWidth: 320, lineHeight: 20 })

    // Three measurements, one preparation: this is the point of the cache.
    expect(prepare).toHaveBeenCalledTimes(1)
    expect(layout).toHaveBeenCalledTimes(3)
    expect(metrics.stats).toMatchObject({ hits: 2, misses: 1 })
  })

  it('prepares separately per font, because glyph advances change with the size', () => {
    const metrics = createTextMetrics()

    metrics.measure('Same text', { font: '11px Inter', maxWidth: 300, lineHeight: 16 })
    metrics.measure('Same text', { font: '12px Inter', maxWidth: 300, lineHeight: 16 })

    expect(prepare).toHaveBeenCalledTimes(2)
  })

  it('does not prepare segment data for a measurement-only pass', () => {
    const metrics = createTextMetrics()

    metrics.measure('Height only', { font: FONT, maxWidth: 300, lineHeight: 16 })

    expect(prepareWithSegments).not.toHaveBeenCalled()
  })

  it('hands the prepared handle to the render path, and prepares segments lazily', () => {
    const metrics = createTextMetrics()
    const args = { font: FONT, maxWidth: 300, lineHeight: 16 }

    metrics.measure('Both paths', args)
    metrics.lines('Both paths', args)

    expect(prepareWithSegments).toHaveBeenCalledTimes(1)

    const prepared = layoutWithLines.mock.calls[0][0]

    expect(prepared).toMatchObject({ kind: 'segments' })

    // ...and the same text measured again still only pays for one of each.
    metrics.measure('Both paths', args)
    metrics.lines('Both paths', args)

    expect(prepare).toHaveBeenCalledTimes(1)
    expect(prepareWithSegments).toHaveBeenCalledTimes(1)
  })

  it('passes the width and line height through to the engine', () => {
    const metrics = createTextMetrics()

    metrics.measure('Anything', { font: FONT, maxWidth: 321, lineHeight: 17 })

    expect(layout).toHaveBeenCalledWith(expect.anything(), 321, 17)
  })

  it('drops both caches when the font underneath changes', () => {
    const metrics = createTextMetrics()

    metrics.measure('Anything', { font: FONT, maxWidth: 300, lineHeight: 16 })
    metrics.clear()

    expect(clearCache).toHaveBeenCalledTimes(1)
    expect(metrics.stats).toMatchObject({ hits: 0, misses: 0, size: 0 })
  })

  it('evicts under memory pressure instead of growing without bound', () => {
    const metrics = createTextMetrics()

    for (let index = 0; index < 1100; index += 1) {
      metrics.measure(`Block ${index}`, { font: FONT, maxWidth: 300, lineHeight: 16 })
    }

    expect(metrics.stats.size).toBe(1024)
    expect(metrics.stats.evictions).toBeGreaterThan(0)
  })
})