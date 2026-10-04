import { resumeFont } from './fonts.ts'
import { BLOCK_TYPE, type Block, type TextBlock } from './markdown.ts'
import { HAIRLINE, type Spacing } from './page.ts'

/**
 * Measurement: how tall the document is.
 *
 * Nothing here calls the measurement engine directly. It is passed in as
 * `metrics`, which keeps this module pure arithmetic — and, more usefully, makes
 * the fit engine testable without a canvas, which jsdom does not have.
 *
 * The metrics interface:
 *
 *   measure(text, { font, fontSize, maxWidth, lineHeight }) -> { height, lineCount }
 *   lines(text,   { font, fontSize, maxWidth, lineHeight }) -> { lines: [{ text, width }] }
 *
 * Two methods rather than one because measurement is the hot path: the real
 * implementation answers `measure` with the cheap layout() call and only reaches
 * for line-by-line data when the renderer actually needs it.
 */
export interface TextMetricsArgs {
  font: string
  fontSize?: number
  maxWidth: number
  lineHeight: number
}

export interface MeasureResult {
  height: number
  lineCount: number
}

export interface LineFragment {
  text: string
  width: number
}

export interface LinesResult extends MeasureResult {
  lines: LineFragment[]
}

/** The measurement engine contract, injected so the fit engine stays pure. */
export interface Metrics {
  measure(text: string, options: TextMetricsArgs): MeasureResult
  lines(text: string, options: TextMetricsArgs): LinesResult
}

/** Everything measureBlocks needs; callers may carry more. */
export interface MeasureOptions {
  metrics: Metrics
  contentWidth: number
  baseFontSize: number
  lineHeightMultiplier: number
  spacing: Spacing
}

interface BlockSpacing {
  spaceBefore?: 'section' | 'item'
}

export function fontSizeFor(block: TextBlock, baseFontSize: number): number {
  return baseFontSize * block.fontScale
}

export function fontFor(block: TextBlock, baseFontSize: number): string {
  return resumeFont({ bold: block.bold, fontSize: fontSizeFor(block, baseFontSize) })
}

export function lineHeightFor(block: TextBlock, baseFontSize: number, lineHeightMultiplier: number): number {
  return fontSizeFor(block, baseFontSize) * lineHeightMultiplier
}

/**
 * The width the line breaker is given: deliberately a hair narrower than the content
 * box.
 *
 * Breaking is measured on a canvas, while the page is rendered by the browser's own
 * text engine. The two disagree by a fraction of a percent, and at the font sizes
 * auto-fit reaches on a short document that fraction is a couple of pixels — enough
 * to push the last word of a tight line past the margin guide. Breaking against a
 * slightly narrower box absorbs the disagreement, and the cost is a marginally
 * earlier wrap on lines that were already at the limit.
 *
 * Both walks (measureBlocks and layoutBlocks) use this, so the measurement and the
 * rendering keep breaking in exactly the same place.
 */
export const LINE_BREAK_SAFETY = 8

export function lineBreakWidth(options: { contentWidth: number }): number {
  return Math.max(1, options.contentWidth - LINE_BREAK_SAFETY)
}

/**
 * The gap above a block, driven by the user's sliders rather than by any hard
 * coded margin: section gaps and item gaps are separate controls.
 */
export function spaceBefore(
  block: Block | { spaceBefore?: 'section' | 'item' },
  spacing: Spacing,
): number {
  if ('spaceBefore' in block && block.spaceBefore === 'section') return spacing.section
  if ('spaceBefore' in block && block.spaceBefore === 'item') return spacing.item

  return 0
}

/**
 * A block's own bottom margin is dropped when the next block brings its own
 * space, or is a rule. Collapsing here — once — is what keeps the measured height
 * and the rendered height from drifting apart.
 */
export function skipsMarginAfter(blocks: Block[], index: number): boolean {
  const next: (Block & BlockSpacing) | undefined = blocks[index + 1]

  return next !== undefined && Boolean(next.spaceBefore) ? true : next?.type === BLOCK_TYPE.rule
}

export function textMetricsArgs(block: TextBlock, options: MeasureOptions): TextMetricsArgs {
  const { baseFontSize, lineHeightMultiplier } = options

  return {
    font: fontFor(block, baseFontSize),
    fontSize: fontSizeFor(block, baseFontSize),
    maxWidth: lineBreakWidth(options),
    lineHeight: lineHeightFor(block, baseFontSize, lineHeightMultiplier),
  }
}

/** Total height of the document, in pixels. */
export function measureBlocks(blocks: Block[], options: MeasureOptions): number {
  const { metrics, spacing } = options

  let height = 0

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index]

    height += spaceBefore(block, spacing)

    if (block.type === BLOCK_TYPE.rule) {
      height += spacing.separator + HAIRLINE + spacing.separator
      continue
    }

    height += metrics.measure(block.text, textMetricsArgs(block, options)).height

    if (skipsMarginAfter(blocks, index)) continue

    height += block.marginBottom
  }

  return height
}

export function fitsOnPage(height: number, maxHeight: number): boolean {
  return height <= maxHeight
}