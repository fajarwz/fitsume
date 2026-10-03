import {
  DEFAULT_MAX_FONT_SIZE,
  DEFAULT_PADDING,
  DEFAULT_SPACING,
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  LINE_HEIGHT_DEFAULT,
  LINE_HEIGHT_MAX,
  LINE_HEIGHT_MIN,
  MAX_PADDING,
  MIN_PADDING,
} from './page.js'

/**
 * Per-resume settings, and the normaliser that every path into the app goes
 * through — stored data, imported backups, and the sliders.
 *
 * Settings are merged into stored documents, so they cannot be trusted: a
 * hand-edited backup or a file from an older version can carry a font size of
 * 900 or a line height of "yes", and either would blow up the fit search. So
 * everything is coerced and clamped here, once, and the rest of the app can take
 * a normalised settings object for granted.
 */
export const DEFAULT_RESUME_SETTINGS = {
  autoFit: true,
  baseFontSize: DEFAULT_MAX_FONT_SIZE,
  lineHeightMultiplier: LINE_HEIGHT_DEFAULT,
  padding: DEFAULT_PADDING,
  spacing: { ...DEFAULT_SPACING },
}

/** Sliders should not be able to produce a resume nobody could read. */
export const SPACING_BOUNDS = {
  section: [0, 48],
  item: [0, 32],
  separator: [0, 48],
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const asNumber = (value, fallback) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const asBoolean = (value, fallback) => (typeof value === 'boolean' ? value : fallback)

export function normaliseSpacing(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}

  return {
    section: clamp(asNumber(source.section, DEFAULT_SPACING.section), ...SPACING_BOUNDS.section),
    item: clamp(asNumber(source.item, DEFAULT_SPACING.item), ...SPACING_BOUNDS.item),
    separator: clamp(
      asNumber(source.separator, DEFAULT_SPACING.separator),
      ...SPACING_BOUNDS.separator,
    ),
  }
}

export function normaliseSettings(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}

  return {
    autoFit: asBoolean(source.autoFit, DEFAULT_RESUME_SETTINGS.autoFit),
    baseFontSize: clamp(
      asNumber(source.baseFontSize, DEFAULT_RESUME_SETTINGS.baseFontSize),
      FONT_SIZE_MIN,
      FONT_SIZE_MAX,
    ),
    lineHeightMultiplier: clamp(
      asNumber(source.lineHeightMultiplier, LINE_HEIGHT_DEFAULT),
      LINE_HEIGHT_MIN,
      LINE_HEIGHT_MAX,
    ),
    padding: clamp(asNumber(source.padding, DEFAULT_PADDING), MIN_PADDING, MAX_PADDING),
    spacing: normaliseSpacing(source.spacing),
  }
}
