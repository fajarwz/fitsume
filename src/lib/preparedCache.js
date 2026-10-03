/**
 * A bounded LRU cache.
 *
 * Measuring means preparing text: normalising, segmenting, and reading glyph
 * advances off a canvas. The engine's own documentation is explicit that this
 * must not be repeated for the same text and font — and the previous
 * implementation did exactly that, on every block, on every pass of the binary
 * search, which throws away the speed that makes the search practical.
 *
 * Insertion order in a Map is the recency order here: a hit is re-inserted, so
 * the first key is always the coldest, and eviction is one call.
 *
 * Deliberately knows nothing about text measurement, so it is trivial to test.
 */
export const DEFAULT_CACHE_SIZE = 1024

export function createPreparedCache({ max = DEFAULT_CACHE_SIZE } = {}) {
  const entries = new Map()
  const stats = { hits: 0, misses: 0, evictions: 0 }

  function key(text, font) {
    return `${font}\u0000${text}`
  }

  return {
    get(text, font) {
      const cacheKey = key(text, font)

      if (!entries.has(cacheKey)) {
        stats.misses += 1

        return undefined
      }

      const value = entries.get(cacheKey)

      entries.delete(cacheKey)
      entries.set(cacheKey, value)
      stats.hits += 1

      return value
    },

    set(text, font, value) {
      const cacheKey = key(text, font)

      if (entries.has(cacheKey)) entries.delete(cacheKey)

      entries.set(cacheKey, value)

      while (entries.size > max) {
        entries.delete(entries.keys().next().value)
        stats.evictions += 1
      }

      return value
    },

    get size() {
      return entries.size
    },

    get stats() {
      return { ...stats, size: entries.size }
    },

    clear() {
      entries.clear()
      stats.hits = 0
      stats.misses = 0
      stats.evictions = 0
    },
  }
}
