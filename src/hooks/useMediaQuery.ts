import { useCallback, useSyncExternalStore } from 'react'

const noop = () => () => {}

function readMatches(query: string): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false

  return window.matchMedia(query).matches
}

/**
 * Media queries as an external store.
 *
 * `useSyncExternalStore` rather than an effect that writes state: the browser owns
 * this value, and subscribing to it is exactly what the hook is for. It also
 * avoids the cascading re-render that setting state inside an effect would cause.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return noop()

      const list = window.matchMedia(query)

      list.addEventListener?.('change', onStoreChange)

      return () => list.removeEventListener?.('change', onStoreChange)
    },
    [query],
  )

  const getSnapshot = useCallback(() => readMatches(query), [query])

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}