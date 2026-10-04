/**
 * Theme preference and resolution.
 *
 * The stored preference is one of three values; the resolved theme is only ever
 * 'light' or 'dark'. Keeping the resolution pure means the shell can render the
 * right theme on first paint instead of flashing the wrong one.
 */
export const THEMES = ['light', 'dark', 'system'] as const

export type ThemePreference = (typeof THEMES)[number]

export type ResolvedTheme = 'light' | 'dark'

export const DEFAULT_THEME = 'system'

export function isTheme(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}

export function resolveTheme(preference: string | undefined, prefersDark = false): ResolvedTheme {
  if (preference === 'light' || preference === 'dark') return preference

  return prefersDark ? 'dark' : 'light'
}