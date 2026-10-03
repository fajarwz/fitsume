/**
 * Theme preference and resolution.
 *
 * The stored preference is one of three values; the resolved theme is only ever
 * 'light' or 'dark'. Keeping the resolution pure means the shell can render the
 * right theme on first paint instead of flashing the wrong one.
 */
export const THEMES = ['light', 'dark', 'system']

export const DEFAULT_THEME = 'system'

export function isTheme(value) {
  return THEMES.includes(value)
}

export function resolveTheme(preference, prefersDark = false) {
  if (preference === 'light' || preference === 'dark') return preference

  return prefersDark ? 'dark' : 'light'
}
