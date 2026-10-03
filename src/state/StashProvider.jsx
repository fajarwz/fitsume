import { createContext, useContext, useMemo } from 'react'

import { useStash } from '../hooks/useStash.js'

/**
 * One library for the whole app.
 *
 * The storage object is resolved once, in App, and handed down: "the browser
 * refused to give us storage" is then a single fact the UI can state plainly,
 * instead of a per-call surprise inside a deep component.
 */
const StashContext = createContext(null)

export function StashProvider({ children, storage, persistent = true }) {
  const stash = useStash(storage)

  const value = useMemo(() => ({ ...stash, storage, persistent }), [stash, storage, persistent])

  return <StashContext.Provider value={value}>{children}</StashContext.Provider>
}

export function useStashContext() {
  const context = useContext(StashContext)

  if (!context) throw new Error('useStashContext must be used inside <StashProvider>')

  return context
}

export default StashProvider
