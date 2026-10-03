import { describe, expect, it } from 'vitest'

import { hasCanvas, profile } from './profile-measurement.js'

/**
 * The regression guard for the cache: the previous implementation prepared the
 * same text again on every block of every pass of the search.
 *
 * The assertion is on preparation counts, not on milliseconds, so it is not flaky
 * on a busy machine. The timings are printed for the record.
 *
 * Needs `canvas` (an optional dependency) for real glyph metrics; without it
 * there is nothing to measure, so it skips.
 */
describe.skipIf(!hasCanvas)('fit search measurement cost', () => {
  it('prepares a small fraction of what the un-cached path prepares', async () => {
    const result = await profile({ runs: 10 })

    console.log(
      [
        '',
        `sample                ${result.sample} (${result.blocks} blocks, ${result.characters} chars)`,
        `preparations, uncached  ${result.uncachedPreparations}`,
        `preparations, warm      ${result.warmPreparations}`,
        `preparations, cold      ${result.coldPreparations}`,
        `ratio                  ${result.preparationRatio}x fewer`,
        `fit run, uncached       ${result.uncachedMs} ms`,
        `fit run, warm           ${result.warmMs} ms  (${result.speedupVsUncached}x faster)`,
        `fit run, cold           ${result.coldMs} ms`,
        `fit runs per 60fps frame ${result.runsPerFrame}`,
        `font                   ${result.fontFamily}`,
        '',
      ].join('\n'),
    )

    expect(result.warmPreparations).toBeGreaterThan(0)
    expect(result.warmPreparations * 10).toBeLessThan(result.uncachedPreparations)
    expect(result.speedupVsUncached).toBeGreaterThan(1)
  })
})
