import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { DEFAULT_THEME, isTheme, resolveTheme } from '../lib/theme.js'
import { useMediaQuery } from '../hooks/useMediaQuery.js'

/**
 * Theme for the app shell.
 *
 * Kept out of the library on purpose: the chosen theme is a preference about the
 * editor, not part of any resume, and it should survive deleting every resume.
 *
 * The system preference comes from useMediaQuery, so the browser stays the owner of
 * that value rather than an effect copying it into state. The only effect here
 * writes to the DOM, which is what effects are for.
 *
 * The resolved theme lands on `data-theme` on <html> — the only place the CSS
 * looks — so a theme change is one attribute, not a re-render of every component.
 */
const THEME_KEY = 'fittyresume.theme'

const ThemeContext = createContext(null)

const storedTheme = (storage) => {
  try {
    const stored = storage?.getItem(THEME_KEY)

    return isTheme(stored) ? stored : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function ThemeProvider({ children, storage }) {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const [theme, setThemeState] = useState(() => storedTheme(storage))

  const resolved = resolveTheme(theme, prefersDark)

  useEffect(() => {
    if (typeof document === 'undefined') return

    document.documentElement.dataset.theme = resolved
  }, [resolved])

  const setTheme = useCallback(
    (next) => {
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

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>')

  return context
}

export default ThemeProvider
