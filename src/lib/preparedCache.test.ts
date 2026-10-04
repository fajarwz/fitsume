import { describe, expect, it } from 'vitest'

import { createPreparedCache } from './preparedCache.ts'

describe('createPreparedCache', () => {
  it('misses on a cold key and hits once it is set', () => {
    const cache = createPreparedCache()

    expect(cache.get('text', 'font')).toBeUndefined()
    cache.set('text', 'font', { prepared: true })

    expect(cache.get('text', 'font')).toEqual({ prepared: true })
    expect(cache.stats).toMatchObject({ hits: 1, misses: 1, size: 1 })
  })

  it('separates entries by font, not just by text', () => {
    const cache = createPreparedCache()

    cache.set('same text', '12px Inter', 'twelve')
    cache.set('same text', '16px Inter', 'sixteen')

    expect(cache.get('same text', '12px Inter')).toBe('twelve')
    expect(cache.get('same text', '16px Inter')).toBe('sixteen')
  })

  it('evicts the coldest entry when it is full', () => {
    const cache = createPreparedCache({ max: 2 })

    cache.set('a', 'f', 1)
    cache.set('b', 'f', 2)
    cache.set('c', 'f', 3)

    expect(cache.get('a', 'f')).toBeUndefined()
    expect(cache.get('b', 'f')).toBe(2)
    expect(cache.get('c', 'f')).toBe(3)
    expect(cache.stats.evictions).toBe(1)
  })

  it('keeps a recently used entry alive', () => {
    const cache = createPreparedCache({ max: 2 })

    cache.set('a', 'f', 1)
    cache.set('b', 'f', 2)
    cache.get('a', 'f') // a is now the most recent
    cache.set('c', 'f', 3)

    expect(cache.get('a', 'f')).toBe(1)
    expect(cache.get('b', 'f')).toBeUndefined()
  })

  it('overwrites in place without growing', () => {
    const cache = createPreparedCache({ max: 2 })

    cache.set('a', 'f', 1)
    cache.set('a', 'f', 2)

    expect(cache.get('a', 'f')).toBe(2)
    expect(cache.size).toBe(1)
  })

  it('clears entries and counters', () => {
    const cache = createPreparedCache()

    cache.set('a', 'f', 1)
    cache.get('a', 'f')
    cache.clear()

    expect(cache.size).toBe(0)
    expect(cache.get('a', 'f')).toBeUndefined()
    expect(cache.stats).toMatchObject({ hits: 0, misses: 1, size: 0 })
  })
})