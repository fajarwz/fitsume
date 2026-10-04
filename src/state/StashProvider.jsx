import { createContext, useContext, useMemo } from 'react'

import { useStash } from '../hooks/useStash.js'

/**
 * One library for the whole app; storage is resolved once in App so a storage refusal is a single fact.
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
