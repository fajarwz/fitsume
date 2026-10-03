import { useMemo } from 'react'

import { findOptimalFit, overflowBy } from '../lib/fit.js'
import { layoutBlocks } from '../lib/layout.js'
import { parseMarkdown } from '../lib/markdown.js'
import { PAGE_HEIGHT, PAGE_WIDTH } from '../lib/page.js'
import { textMetrics } from '../lib/textMetrics.js'

/**
 * The whole pipeline for one document: parse, fit, lay out.
 *
 * Everything here is derived, so it is a single memo: when the markdown or the
 * settings change, the document is re-fitted and re-laid-out once, with the same
 * metrics object the fit used.
 *
 * With auto-fit off, the user's own font size stands — and if it does not fit,
 * that is reported rather than silently shrunk, because a resume the user sized
 * deliberately should not move under them.
 */
export function useFit(markdown, settings) {
  return useMemo(() => {
    const blocks = parseMarkdown(markdown)
    const contentWidth = PAGE_WIDTH - settings.padding * 2
    const maxHeight = PAGE_HEIGHT - settings.padding * 2

    const base = {
      metrics: textMetrics,
      contentWidth,
      maxHeight,
      padding: settings.padding,
      spacing: settings.spacing,
      maxFontSize: settings.baseFontSize,
    }

    if (!settings.autoFit) {
      const fontSize = settings.baseFontSize
      const lineHeightMultiplier = settings.lineHeightMultiplier
      const options = { ...base, baseFontSize: fontSize, lineHeightMultiplier }

      return {
        blocks,
        fontSize,
        lineHeightMultiplier,
        height: undefined,
        overflow: overflowBy(blocks, base, fontSize, lineHeightMultiplier),
        positioned: layoutBlocks(blocks, options),
      }
    }

    const fit = findOptimalFit(blocks, base)
    const options = {
      ...base,
      baseFontSize: fit.fontSize,
      lineHeightMultiplier: fit.lineHeightMultiplier,
    }

    return {
      blocks,
      fontSize: fit.fontSize,
      lineHeightMultiplier: fit.lineHeightMultiplier,
      height: fit.height,
      overflow: 0,
      positioned: layoutBlocks(blocks, options),
    }
  }, [markdown, settings])
}
