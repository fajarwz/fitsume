import { measureBlocks, type Metrics } from './measure.ts'
import {
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  FONT_SIZE_TOLERANCE,
  LINE_HEIGHT_MAX,
  LINE_HEIGHT_MIN,
  LINE_HEIGHT_TOLERANCE,
  type Spacing,
} from './page.ts'
import type { Block } from './markdown.ts'

/**
 * The fit search. Two passes:
 *
 *   Pass 1 — the largest base font size that fits, at the tightest line spacing.
 *   Pass 2 — with that font size locked, the largest line spacing that still fits.
 *
 * Measuring is pure arithmetic over cached glyph widths, so hundreds of passes
 * cost less than a single DOM measurement would.
 *
 * Note the search upper bound is the *user's* maximum font size, not a constant.
 * Capping afterwards instead (which is what the previous implementation did)
 * computes the line spacing for a font size that is never rendered.
 */
export interface FitOptions {
  metrics: Metrics
  contentWidth: number
  maxHeight: number
  spacing: Spacing
  maxFontSize?: number
  minFontSize?: number
  padding?: number
}

export interface FitResult {
  fontSize: number
  lineHeightMultiplier: number
  height: number
}

function measureAt(
  blocks: Block[],
  options: FitOptions,
  baseFontSize: number,
  lineHeightMultiplier: number,
): number {
  return measureBlocks(blocks, { ...options, baseFontSize, lineHeightMultiplier })
}

function round(value: number, places: number): number {
  const factor = 10 ** places

  return Math.floor(value * factor) / factor
}

export function largestFontSizeThatFits(blocks: Block[], options: FitOptions): number {
  const { maxHeight, maxFontSize = FONT_SIZE_MAX, minFontSize = FONT_SIZE_MIN } = options

  // Nothing fits at the smallest size: bail out rather than returning a size that
  // silently overflows. The caller shows the overflow state.
  if (measureAt(blocks, options, minFontSize, LINE_HEIGHT_MIN) > maxHeight) return minFontSize

  let lo = minFontSize
  let hi = Math.max(maxFontSize, minFontSize)

  while (hi - lo > FONT_SIZE_TOLERANCE) {
    const mid = (lo + hi) / 2

    if (measureAt(blocks, options, mid, LINE_HEIGHT_MIN) <= maxHeight) {
      lo = mid
    } else {
      hi = mid
    }
  }

  return round(lo, 2)
}

export function largestLineHeightThatFits(blocks: Block[], options: FitOptions, baseFontSize: number): number {
  const { maxHeight } = options

  if (measureAt(blocks, options, baseFontSize, LINE_HEIGHT_MIN) > maxHeight) return LINE_HEIGHT_MIN

  let lo = LINE_HEIGHT_MIN
  let hi = LINE_HEIGHT_MAX

  while (hi - lo > LINE_HEIGHT_TOLERANCE) {
    const mid = (lo + hi) / 2

    if (measureAt(blocks, options, baseFontSize, mid) <= maxHeight) {
      lo = mid
    } else {
      hi = mid
    }
  }

  return round(lo, 3)
}

/**
 * Returns the fitted typography, plus the measured height at those values so the
 * UI can show a real "fits / overflows by N px" state without measuring again.
 */
export function findOptimalFit(blocks: Block[], options: FitOptions): FitResult {
  const fontSize = largestFontSizeThatFits(blocks, options)
  const lineHeightMultiplier = largestLineHeightThatFits(blocks, options, fontSize)

  return {
    fontSize,
    lineHeightMultiplier,
    height: measureAt(blocks, options, fontSize, lineHeightMultiplier),
  }
}

/**
 * With auto-fit off, the user's font size may still overflow. Report it rather
 * than clipping it silently.
 */
export function overflowBy(
  blocks: Block[],
  options: FitOptions,
  baseFontSize: number,
  lineHeightMultiplier: number,
): number {
  const { maxHeight } = options

  return Math.max(
    0,
    Math.ceil(measureAt(blocks, options, baseFontSize, lineHeightMultiplier) - maxHeight),
  )
}