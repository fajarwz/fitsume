import * as pretext from '@chenglou/pretext'

import { findOptimalFit } from '../src/lib/fit.js'
import { parseMarkdown } from '../src/lib/markdown.js'
import { DEFAULT_PADDING, DEFAULT_SPACING, PAGE_HEIGHT, PAGE_WIDTH } from '../src/lib/page.js'
import { createPreparedCache } from '../src/lib/preparedCache.js'
import { SAMPLES } from '../src/lib/samples.js'
import { createTextMetrics } from '../src/lib/textMetrics.js'

/**
 * Compares the fit search with and without prepared-handle reuse, on a real
 * canvas, with real line breaking.
 *
 * Two ways to run it:
 *
 *   npx vitest run scripts/profile-measurement.test.js      # prints the table
 *   # ...or against the dev server, from the browser console:
 *   const { profile } = await import('/scripts/profile-measurement.js')
 *   console.table(await profile())
 *
 * `uncached` reproduces what the app used to do — prepare on every call, for every
 * block, on every pass of the search — so the comparison is apples to apples:
 * same resume, same engine, same options.
 *
 * Caveat worth knowing: under jsdom the canvas has no Inter loaded (node-canvas
 * ships its own fonts and jsdom does not fetch webfonts), so the glyph advances
 * are not Inter's. The ratios and the preparation counts are the meaningful part;
 * the absolute milliseconds are indicative.
 */

const FIT_OPTIONS = {
  contentWidth: PAGE_WIDTH - DEFAULT_PADDING * 2,
  maxHeight: PAGE_HEIGHT - DEFAULT_PADDING * 2,
  spacing: DEFAULT_SPACING,
  maxFontSize: 14,
}

const noReuseMetrics = {
  measure(text, { font, maxWidth, lineHeight }) {
    return pretext.layout(pretext.prepare(text, font), maxWidth, lineHeight)
  },
  lines(text, { font, maxWidth, lineHeight }) {
    return pretext.layoutWithLines(pretext.prepareWithSegments(text, font), maxWidth, lineHeight)
  },
}

function averageMs(run, times) {
  const start = performance.now()

  for (let index = 0; index < times; index += 1) run()

  return (performance.now() - start) / times
}

export async function profile({ runs = 20, sampleId } = {}) {
  // A real browser needs the webfont before measuring; jsdom has none to load.
  if (document.fonts?.load) {
    await document.fonts.load('11px "Inter Variable"')
    await document.fonts.ready
  }

  const sample = sampleId
    ? SAMPLES.find((entry) => entry.id === sampleId)
    : (SAMPLES.find((entry) => entry.length === 'dense') ?? SAMPLES[0])

  const blocks = parseMarkdown(sample.markdown)

  // The un-cached path prepares once per call, so counting calls counts
  // preparations exactly.
  const calls = { measures: 0, lines: 0 }

  const uncachedMetrics = {
    measure(text, args) {
      calls.measures += 1

      return noReuseMetrics.measure(text, args)
    },
    lines(text, args) {
      calls.lines += 1

      return noReuseMetrics.lines(text, args)
    },
  }

  // The cached path prepares once per distinct text+font. Every cache miss both
  // prepares and registers a key, so counting keys counts preparations — at most
  // two per key, since height and line data are prepared separately.
  const inner = createPreparedCache()
  const preparedKeys = new Set()

  const countingCache = {
    get: (text, font) => inner.get(text, font),
    set: (text, font, value) => {
      preparedKeys.add(`${font}\u0000${text}`)

      return inner.set(text, font, value)
    },
    get size() {
      return inner.size
    },
    get stats() {
      return inner.stats
    },
    clear: () => inner.clear(),
  }

  const cached = createTextMetrics({ cache: countingCache })
  const run = (metrics) => findOptimalFit(blocks, { ...FIT_OPTIONS, metrics })

  // Warm both paths before timing anything.
  run(uncachedMetrics)
  run(cached)

  preparedKeys.clear()
  inner.clear()
  calls.measures = 0
  calls.lines = 0

  const results = {
    sample: sample.id,
    blocks: blocks.length,
    characters: sample.markdown.length,
    fontFamily: getComputedStyle(document.body).fontFamily || 'unknown',
    uncachedMs: Number(averageMs(() => run(uncachedMetrics), runs).toFixed(3)),
    uncachedPreparations: calls.measures + calls.lines,
  }

  results.warmMs = Number(averageMs(() => run(cached), runs).toFixed(3))
  results.warmPreparations = preparedKeys.size

  inner.clear()
  preparedKeys.clear()
  results.coldMs = Number(averageMs(() => run(cached), 1).toFixed(3))
  results.coldPreparations = preparedKeys.size

  results.cacheStats = inner.stats
  results.speedupVsUncached = Number((results.uncachedMs / results.warmMs).toFixed(2))
  results.preparationRatio = Number(
    (results.uncachedPreparations / Math.max(results.warmPreparations, 1)).toFixed(1),
  )
  results.runsPerFrame = Number((16.7 / results.warmMs).toFixed(1))

  return results
}

export { FIT_OPTIONS, noReuseMetrics }

/**
 * jsdom ships no font engine; the real measurement path needs a canvas. The
 * `canvas` package is an optional dependency, so this can legitimately be false.
 */
export const hasCanvas = (() => {
  try {
    if (typeof document === 'undefined') return false

    return Boolean(document.createElement('canvas').getContext('2d'))
  } catch {
    return false
  }
})()
