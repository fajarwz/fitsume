/**
 * Page geometry and fit bounds, in CSS pixels.
 *
 * A4 is 210 × 297 mm. The preview renders a fixed-width page and the print path
 * scales it to the real sheet, so everything downstream can work in one
 * coordinate space.
 */
export const PAGE_WIDTH = 620
export const PAGE_HEIGHT = Math.round(PAGE_WIDTH * (297 / 210))

export const DEFAULT_PADDING = 40
export const MIN_PADDING = 16
export const MAX_PADDING = 80

export const LINE_HEIGHT_MIN = 1.15
export const LINE_HEIGHT_MAX = 1.8
export const LINE_HEIGHT_DEFAULT = 1.5

/** Fit search bounds for the base font size. */
export const FONT_SIZE_MIN = 6
export const FONT_SIZE_MAX = 24
export const DEFAULT_MAX_FONT_SIZE = 14

/** The rule drawn for `---`. One CSS pixel, and it counts towards the page height. */
export const HAIRLINE = 1

/** The explicit gaps, in pixels, that the settings sliders drive. */
export interface Spacing {
  section: number
  item: number
  separator: number
}

/** Spacing defaults, in pixels. These are the numbers the settings sliders drive. */
export const DEFAULT_SPACING: Spacing = {
  section: 18,
  item: 10,
  separator: 16,
}

/** Binary search tolerances. Tighter costs measurement passes for no visible gain. */
export const FONT_SIZE_TOLERANCE = 0.01
export const LINE_HEIGHT_TOLERANCE = 0.001