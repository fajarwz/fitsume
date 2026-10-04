import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'

import type { Storage } from '../lib/stash.ts'
import { useStash, type UseStashResult } from '../hooks/useStash.ts'

/**
 * One library for the whole app; storage is resolved once in App so a storage refusal is a single fact.
 */
type StashContextValue = UseStashResult & { storage: Storage; persistent: boolean }

const StashContext = createContext<StashContextValue | null>(null)

interface StashProviderProps {
  children: ReactNode
  storage: Storage
  persistent?: boolean
}

export function StashProvider({ children, storage, persistent = true }: StashProviderProps) {
  const stash = useStash(storage)

  const value = useMemo(() => ({ ...stash, storage, persistent }), [stash, storage, persistent])

  return <StashContext.Provider value={value}>{children}</StashContext.Provider>
}

export function useStashContext(): StashContextValue {
  const context = useContext(StashContext)

  if (!context) throw new Error('useStashContext must be used inside <StashProvider>')

  return context
}

export default StashProvider