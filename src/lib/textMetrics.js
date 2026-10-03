import {
  clearCache as clearEngineCache,
  layout,
  layoutWithLines,
  prepare,
  prepareWithSegments,
} from '@chenglou/pretext'

import { createPreparedCache } from './preparedCache.js'

/**
 * The only file in lib/ that talks to the measurement engine, and the only place
 * that knows pretext exists.
 *
 * Everything else in lib/ takes a `metrics` object, which is why the fit engine
 * can be unit tested without a canvas — and why swapping the engine later is a
 * change to one file.
 *
 * Prepared handles are cached. `prepare` is the expensive step (normalise,
 * segment, measure glyphs on a canvas) and the fit search calls it dozens of
 * times per keystroke for the same strings: pass 2 in particular holds the font
 * size fixed, so almost every call in it is a repeat.
 *
 * Handles are prepared lazily per kind, so a measurement-only pass never pays for
 * the line-by-line data the renderer needs.
 */
export function createTextMetrics({ cache = createPreparedCache() } = {}) {
  function entryFor(text, font) {
    let entry = cache.get(text, font)

    if (!entry) entry = cache.set(text, font, {})

    return entry
  }

  function plainFor(text, font) {
    const entry = entryFor(text, font)

    entry.plain ??= prepare(text, font)

    return entry.plain
  }

  function segmentsFor(text, font) {
    const entry = entryFor(text, font)

    entry.segments ??= prepareWithSegments(text, font)

    return entry.segments
  }

  return {
    /** The hot path: height only, no line data. */
    measure(text, { font, maxWidth, lineHeight }) {
      if (!text) return { height: 0, lineCount: 0 }

      return layout(plainFor(text, font), maxWidth, lineHeight)
    },

    /** The render path: the same line breaking, materialised. */
    lines(text, { font, maxWidth, lineHeight }) {
      if (!text) return { height: 0, lineCount: 0, lines: [] }

      return layoutWithLines(segmentsFor(text, font), maxWidth, lineHeight)
    },

    get stats() {
      return cache.stats
    },

    /** Used when the font changes under us, and by the profiling harness. */
    clear() {
      cache.clear()
      clearEngineCache()
    },
  }
}

/** Shared instance for the app. Tests build their own. */
export const textMetrics = createTextMetrics()
