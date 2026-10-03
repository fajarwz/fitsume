import { describe, expect, it } from 'vitest'

import { DEFAULT_PADDING, FONT_SIZE_MAX, FONT_SIZE_MIN, LINE_HEIGHT_MIN } from './page.js'
import { DEFAULT_RESUME_SETTINGS, normaliseSettings, normaliseSpacing } from './settings.js'

describe('normaliseSettings', () => {
  it('fills in every default for nothing at all', () => {
    expect(normaliseSettings(undefined)).toEqual(DEFAULT_RESUME_SETTINGS)
    expect(normaliseSettings(null)).toEqual(DEFAULT_RESUME_SETTINGS)
    expect(normaliseSettings('nonsense')).toEqual(DEFAULT_RESUME_SETTINGS)
    expect(normaliseSettings({})).toEqual(DEFAULT_RESUME_SETTINGS)
  })

  it('keeps the values it is given', () => {
    const settings = normaliseSettings({
      autoFit: false,
      baseFontSize: 11,
      lineHeightMultiplier: 1.3,
      padding: 32,
      spacing: { section: 20, item: 8, separator: 12 },
    })

    expect(settings).toEqual({
      autoFit: false,
      baseFontSize: 11,
      lineHeightMultiplier: 1.3,
      padding: 32,
      spacing: { section: 20, item: 8, separator: 12 },
    })
  })

  it('clamps a font size no page could hold', () => {
    expect(normaliseSettings({ baseFontSize: 900 }).baseFontSize).toBe(FONT_SIZE_MAX)
    expect(normaliseSettings({ baseFontSize: 0.1 }).baseFontSize).toBe(FONT_SIZE_MIN)
    expect(normaliseSettings({ baseFontSize: -12 }).baseFontSize).toBe(FONT_SIZE_MIN)
  })

  it('clamps a line height that would run off the page, and one that would overlap', () => {
    expect(normaliseSettings({ lineHeightMultiplier: 9 }).lineHeightMultiplier).toBe(1.8)
    expect(normaliseSettings({ lineHeightMultiplier: 0.2 }).lineHeightMultiplier).toBe(
      LINE_HEIGHT_MIN,
    )
  })

  it('clamps the margin to something printable', () => {
    expect(normaliseSettings({ padding: 400 }).padding).toBe(80)
    expect(normaliseSettings({ padding: 1 }).padding).toBe(16)
  })

  it('rejects values that are not finite numbers', () => {
    expect(normaliseSettings({ baseFontSize: Number.NaN }).baseFontSize).toBe(
      DEFAULT_RESUME_SETTINGS.baseFontSize,
    )
    expect(normaliseSettings({ baseFontSize: Number.POSITIVE_INFINITY }).baseFontSize).toBe(
      DEFAULT_RESUME_SETTINGS.baseFontSize,
    )
    expect(normaliseSettings({ padding: '40' }).padding).toBe(DEFAULT_PADDING)
    expect(normaliseSettings({ autoFit: 'yes' }).autoFit).toBe(true)
  })

  it('keeps the parts of a partially valid settings object', () => {
    const settings = normaliseSettings({ baseFontSize: 12, spacing: { section: 'wide' } })

    expect(settings.baseFontSize).toBe(12)
    expect(settings.spacing.section).toBe(DEFAULT_RESUME_SETTINGS.spacing.section)
    expect(settings.spacing.item).toBe(DEFAULT_RESUME_SETTINGS.spacing.item)
  })
})

describe('normaliseSpacing', () => {
  it('clamps each spacing independently', () => {
    expect(normaliseSpacing({ section: 100, item: 100, separator: 100 })).toEqual({
      section: 48,
      item: 32,
      separator: 48,
    })
  })

  it('never returns a negative gap', () => {
    expect(normaliseSpacing({ section: -5, item: -5, separator: -5 })).toEqual({
      section: 0,
      item: 0,
      separator: 0,
    })
  })
})
