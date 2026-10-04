import { describe, expect, it } from 'vitest'

import { contentBottom, layoutBlocks } from './layout.js'
import { findOptimalFit, overflowBy } from './fit.js'
import { parseMarkdown } from './markdown.js'
import {
  DEFAULT_PADDING,
  DEFAULT_SPACING,
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  LINE_HEIGHT_MAX,
  LINE_HEIGHT_MIN,
  PAGE_HEIGHT,
  PAGE_WIDTH,
} from './page.js'
import { SAMPLES } from './samples.js'
import { textMetrics } from './textMetrics.js'

/**
 * Every shipped sample, against the real measurement engine.
 *
 * This is the test that answers "does the thing actually work": it fits all six
 * samples and then checks the geometry that gets *rendered*, not just the number
 * the search returned. If the preview and the fit ever disagreed, this is where it
 * would show up.
 *
 * Needs a canvas; without the optional `canvas` dependency there is nothing to
 * measure, so it skips.
 */
const hasCanvas = (() => {
  try {
    if (typeof document === 'undefined') return false

    return Boolean(document.createElement('canvas').getContext('2d'))
  } catch {
    return false
  }
})()

const options = (overrides = {}) => ({
  metrics: textMetrics,
  contentWidth: PAGE_WIDTH - DEFAULT_PADDING * 2,
  maxHeight: PAGE_HEIGHT - DEFAULT_PADDING * 2,
  padding: DEFAULT_PADDING,
  spacing: DEFAULT_SPACING,
  maxFontSize: FONT_SIZE_MAX,
  ...overrides,
})

if (hasCanvas) {
  describe('every sample', () => {
    for (const sample of SAMPLES) {
      describe(`${sample.id} (${sample.length})`, () => {
        const blocks = parseMarkdown(sample.markdown)
        const opts = options()
        const fit = findOptimalFit(blocks, opts)
        const positioned = layoutBlocks(blocks, {
          ...opts,
          baseFontSize: fit.fontSize,
          lineHeightMultiplier: fit.lineHeightMultiplier,
        })

        it('produces layout, not an empty page', () => {
          expect(blocks.length).toBeGreaterThan(0)
          expect(positioned.length).toBeGreaterThan(0)
        })

        it('stays inside the fit bounds', () => {
          expect(fit.fontSize).toBeGreaterThanOrEqual(FONT_SIZE_MIN)
          expect(fit.fontSize).toBeLessThanOrEqual(FONT_SIZE_MAX)
          expect(fit.lineHeightMultiplier).toBeGreaterThanOrEqual(LINE_HEIGHT_MIN)
          expect(fit.lineHeightMultiplier).toBeLessThanOrEqual(LINE_HEIGHT_MAX)
        })

        it('either fits on one page, or says so at the smallest size it will use', () => {
          if (fit.height <= opts.maxHeight) {
            expect(fit.height).toBeLessThanOrEqual(opts.maxHeight)

            return
          }

          // Nothing fits, so the honest outcome is the floor plus a reported overflow.
          expect(fit.fontSize).toBe(FONT_SIZE_MIN)
          expect(overflowBy(blocks, opts, fit.fontSize, fit.lineHeightMultiplier)).toBeGreaterThan(
            0,
          )
        })

        it('draws inside the page it was fitted for', () => {
          const bottom = contentBottom(positioned)

          if (fit.height <= opts.maxHeight) {
            // The rendered content must fit the sheet, not just the measurement.
            expect(bottom).toBeLessThanOrEqual(PAGE_HEIGHT - DEFAULT_PADDING + 0.5)
          } else {
            expect(bottom).toBeGreaterThan(PAGE_HEIGHT - DEFAULT_PADDING)
          }
        })
      })
    }
  })
}

describe.skipIf(!hasCanvas)('the shape of the set', () => {
  const fitOf = (sample, overrides = {}) =>
    findOptimalFit(parseMarkdown(sample.markdown), options(overrides))
  const byLength = (length) => SAMPLES.find((entry) => entry.length === length)

  it('fits every shipped sample on one page', () => {
    // A sample that overflowed would be a terrible first impression, so the set is
    // expected to keep fitting. The overflow path is covered by the deliberately
    // absurd fixture in fit.test.js instead.
    for (const sample of SAMPLES) {
      const fit = fitOf(sample)

      expect(fit.height, `${sample.id} overflows`).toBeLessThanOrEqual(options().maxHeight)
    }
  })

  it('spends the room a short resume leaves over', () => {
    const short = fitOf(byLength('minimal'))
    const long = fitOf(byLength('long'))

    expect(short.fontSize).toBeGreaterThan(long.fontSize)
  })

  it('sends a document with a tighter margin a bigger font', () => {
    const sample = byLength('normal')
    const generous = fitOf(sample, { padding: 16 })
    const tight = fitOf(sample, { padding: 80 })

    // Less margin means more room, and the search is expected to spend it.
    expect(generous.fontSize).toBeGreaterThanOrEqual(tight.fontSize)
  })
})
