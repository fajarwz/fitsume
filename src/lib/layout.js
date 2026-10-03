import {
  fontFor,
  fontSizeFor,
  lineBreakWidth,
  lineHeightFor,
  skipsMarginAfter,
  spaceBefore,
} from './measure.js'
import { BLOCK_TYPE } from './markdown.js'
import { HAIRLINE } from './page.js'

export const POSITIONED_TYPE = {
  line: 'line',
  rule: 'rule',
}

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
export function layoutBlocks(blocks, options) {
  const { metrics, padding, spacing } = options
  const positioned = []

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

    const { lines } = metrics.lines(block.text, {
      font,
      fontSize,
      maxWidth: lineBreakWidth(options),
      lineHeight,
    })

    for (const line of lines) {
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
      })

      y += lineHeight
    }

    if (skipsMarginAfter(blocks, index)) continue

    y += block.marginBottom
  }

  return positioned
}

/** Bottom edge of the laid-out content, including the page padding. */
export function contentBottom(positioned) {
  return positioned.reduce((bottom, item) => {
    const height = item.type === POSITIONED_TYPE.rule ? HAIRLINE : item.lineHeight

    return Math.max(bottom, item.y + height)
  }, 0)
}
