import {
  fontFor,
  fontSizeFor,
  lineBreakWidth,
  lineHeightFor,
  skipsMarginAfter,
  spaceBefore,
  type LineFragment,
  type Metrics,
} from './measure.ts'
import { findAddresses, findLabels, hasLink, segmentsFrom, type Segment } from './links.ts'
import { BLOCK_TYPE, type Block } from './markdown.ts'
import { HAIRLINE, type Spacing } from './page.ts'

export const POSITIONED_TYPE = {
  line: 'line',
  rule: 'rule',
} as const

/** Everything layoutBlocks needs; callers may carry more. */
export interface LayoutOptions {
  metrics: Metrics
  contentWidth: number
  padding: number
  baseFontSize: number
  lineHeightMultiplier: number
  spacing: Spacing
}

export interface PositionedLine {
  type: 'line'
  text: string
  x: number
  y: number
  font: string
  fontSize: number
  lineHeight: number
  bold: boolean
  color: string
  keepWithNext: boolean
  segments?: Segment[]
}

export interface PositionedRule {
  type: 'rule'
  y: number
}

export type PositionedItem = PositionedLine | PositionedRule

/**
 * Turns blocks into absolutely positioned items.
 *
 * This walks the document exactly the way measureBlocks does, using the same two
 * helpers for spacing. That shared walk is the point: when the two walks diverge,
 * the preview and the fit engine disagree and the app lies about fitting. The
 * equality is pinned by a test.
 *
 * Colors stay semantic here ('ink', 'inkMuted', 'inkFaint') and are resolved to
 * CSS variables by the renderer, so the document and the shell cannot drift.
 */
export function layoutBlocks(blocks: Block[], options: LayoutOptions): PositionedItem[] {
  const { metrics, padding, spacing } = options
  const positioned: PositionedItem[] = []

  let y = padding

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index]

    y += spaceBefore(block, spacing)

    if (block.type === BLOCK_TYPE.rule) {
      y += spacing.separator
      positioned.push({ type: POSITIONED_TYPE.rule, y })
      y += HAIRLINE + spacing.separator
      continue
    }

    const fontSize = fontSizeFor(block, options.baseFontSize)
    const lineHeight = lineHeightFor(block, options.baseFontSize, options.lineHeightMultiplier)
    const font = fontFor(block, options.baseFontSize)

    const { lines }: { lines: LineFragment[] } = metrics.lines(block.text, {
      font,
      fontSize,
      maxWidth: lineBreakWidth(options),
      lineHeight,
    })

    for (const line of lines) {
      // Links are found here rather than in the parser, so the blocks the fit engine
      // measures are untouched by them: the same characters, split for the renderer.
      const segments = segmentsFrom(
        line.text,
        findLabels(line.text, block.labels, block.text),
        findAddresses(line.text),
      )

      positioned.push({
        type: POSITIONED_TYPE.line,
        text: line.text,
        x: padding,
        y,
        font,
        fontSize,
        lineHeight,
        bold: block.bold,
        color: block.color,
        keepWithNext: block.keepWithNext === true,
        segments: hasLink(segments) ? segments : undefined,
      })

      y += lineHeight
    }

    if (skipsMarginAfter(blocks, index)) continue

    y += block.marginBottom
  }

  return positioned
}

/** Bottom edge of the laid-out content, including the page padding. */
export function contentBottom(positioned: PositionedItem[]): number {
  return positioned.reduce((bottom, item) => {
    const height = item.type === POSITIONED_TYPE.rule ? HAIRLINE : item.lineHeight

    return Math.max(bottom, item.y + height)
  }, 0)
}