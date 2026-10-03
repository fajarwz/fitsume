import { useEffect, useState } from 'react'

/**
 * Trailing debounce.
 *
 * The fit search is cheap enough for a keystroke, but not for a keystroke on a
 * long resume while the user is still mid-word: delaying the expensive work until
 * they pause is what keeps the editor feeling immediate.
 *
 * A delay of zero means "no debounce", and returns the value as it is rather than
 * writing state synchronously in an effect.
 */
export function useDebouncedValue(value, delay = 180) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    if (delay <= 0) return undefined

    const timer = setTimeout(() => setDebounced(value), delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return delay <= 0 ? value : debounced
}
