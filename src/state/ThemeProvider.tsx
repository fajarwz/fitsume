import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { DEFAULT_THEME, isTheme, resolveTheme } from '../lib/theme.ts'
import type { ResolvedTheme, ThemePreference } from '../lib/theme.ts'
import type { Storage } from '../lib/stash.ts'
import { useMediaQuery } from '../hooks/useMediaQuery.ts'

/**
 * Kept out of the library: the theme is an editor preference that must survive deleting
 * every resume (THEME_KEY must stay stable).
 */
const THEME_KEY = 'fitsume.theme'

interface ThemeContextValue {
  theme: ThemePreference
  resolved: ResolvedTheme
  setTheme: (next: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const storedTheme = (storage: Storage): ThemePreference => {
  try {
    const stored = storage?.getItem(THEME_KEY)

    return isTheme(stored) ? stored : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

interface ThemeProviderProps {
  children: ReactNode
  storage: Storage
}

export function ThemeProvider({ children, storage }: ThemeProviderProps) {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const [theme, setThemeState] = useState<ThemePreference>(() => storedTheme(storage))

  const resolved = resolveTheme(theme, prefersDark)

  useEffect(() => {
    if (typeof document === 'undefined') return

    document.documentElement.dataset.theme = resolved
  }, [resolved])

  const setTheme = useCallback(
    (next: ThemePreference) => {
      if (!isTheme(next)) return

      setThemeState(next)

      try {
        storage?.setItem(THEME_KEY, next)
      } catch {
        // A blocked store is not worth interrupting the user over.
      }
    },
    [storage],
  )

  const value = useMemo(() => ({ theme, resolved, setTheme }), [theme, resolved, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>')

  return context
}

export default ThemeProvider