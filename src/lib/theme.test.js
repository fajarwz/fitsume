import { describe, expect, it } from 'vitest'

import { DEFAULT_THEME, isTheme, resolveTheme, THEMES } from './theme.js'

describe('theme', () => {
  it('offers light, dark and system', () => {
    expect(THEMES).toEqual(['light', 'dark', 'system'])
    expect(DEFAULT_THEME).toBe('system')
  })

  it('recognises only known themes', () => {
    expect(isTheme('dark')).toBe(true)
    expect(isTheme('light')).toBe(true)
    expect(isTheme('system')).toBe(true)
    expect(isTheme('midnight')).toBe(false)
    expect(isTheme(undefined)).toBe(false)
  })

  it('honours an explicit preference over the system setting', () => {
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('light', true)).toBe('light')
  })

  it('follows the system setting when asked to', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('treats an unknown preference as the system setting', () => {
    expect(resolveTheme(undefined, true)).toBe('dark')
    expect(resolveTheme('nonsense', false)).toBe('light')
  })
})
