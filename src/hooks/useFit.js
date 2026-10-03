import { useEffect, useMemo, useState } from 'react'

import { findOptimalFit } from '../lib/fit.js'
import { layoutBlocks } from '../lib/layout.js'
import { parseMarkdown } from '../lib/markdown.js'
import { PAGE_HEIGHT, PAGE_WIDTH } from '../lib/page.js'
import { paginateItems } from '../lib/paginate.js'
import { textMetrics } from '../lib/textMetrics.js'

/**
 * Tracks the webfont, so a fit is never trusted when it was measured against the
 * fallback.
 *
 * The measurement engine measures whatever font the canvas has *now*, and Geist
 * arrives after the first paint. Fitting before it lands means fitting the fallback:
 * the page then renders in Geist, the lines come out wider than they were measured,
 * and the last word of a tight line crosses the margin. It shows up worst on the
 * shortest document, because auto-fit has grown that one to the largest font — a
 * proportional width error is a proportional number of pixels.
 *
 * A version rather than a boolean because the value is used: a change of version is
 * what tells the fit that its cached measurements belong to another font.
 */
const hasFontApi = () => typeof document !== 'undefined' && Boolean(document.fonts?.ready)

function useFontVersion() {
  // Starting at 1 with no font API to wait for means the first fit is already final,
  // instead of waiting on a promise that will never arrive.
  const [version, setVersion] = useState(hasFontApi() ? 0 : 1)

  useEffect(() => {
    if (!hasFontApi()) return undefined

    let cancelled = false

    document.fonts.ready.then(() => {
      if (cancelled) return

      // Every prepared handle in the cache was measured against the fallback font, so
      // they are dropped here — outside render, and before the fit is re-run.
      textMetrics.clear()
      setVersion(1)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return version
}

/**
 * The whole pipeline for one document: parse, fit, lay out, paginate.
 *
 * Everything here is derived, so it is a single memo: when the markdown or the
 * settings change, the document is re-fitted and re-laid-out once, with the same
 * metrics object the fit used.
 *
 * With auto-fit off, the user's own font size stands rather than being quietly
 * reduced, and the document is paginated instead of clipped: a resume the user sized
 * deliberately should not move under them, and it should not lose its second half.
 */
export function useFit(markdown, settings) {
  const fontVersion = useFontVersion()

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

    // Pagination is not conditional: a document that fits one page paginates to one
    // page. One render path serves both, and the degenerate case — auto-fit bottomed
    // out at the smallest font size and still too long — flows onto a second page
    // rather than being cut off at the margin.
    const finished = (result) => {
      const pages = paginateItems(result.positioned, { padding: settings.padding })

      return { ...result, pages, pageCount: pages.length }
    }

    // Version 0 means the webfont has not landed yet. A fit computed now would be a fit
    // of the fallback, and every line break in it would be wrong a frame later, so the
    // document is laid out at the user's own size for that one frame instead and the
    // real search runs as soon as the font is in.
    if (fontVersion === 0) {
      const options = {
        ...base,
        baseFontSize: settings.baseFontSize,
        lineHeightMultiplier: settings.lineHeightMultiplier,
      }

      return finished({
        blocks,
        fontSize: settings.baseFontSize,
        lineHeightMultiplier: settings.lineHeightMultiplier,
        height: undefined,
        positioned: layoutBlocks(blocks, options),
      })
    }

    if (!settings.autoFit) {
      const fontSize = settings.baseFontSize
      const lineHeightMultiplier = settings.lineHeightMultiplier
      const options = { ...base, baseFontSize: fontSize, lineHeightMultiplier }

      return finished({
        blocks,
        fontSize,
        lineHeightMultiplier,
        height: undefined,
        positioned: layoutBlocks(blocks, options),
      })
    }

    const fit = findOptimalFit(blocks, base)
    const options = {
      ...base,
      baseFontSize: fit.fontSize,
      lineHeightMultiplier: fit.lineHeightMultiplier,
    }

    return finished({
      blocks,
      fontSize: fit.fontSize,
      lineHeightMultiplier: fit.lineHeightMultiplier,
      height: fit.height,
      positioned: layoutBlocks(blocks, options),
    })
  }, [markdown, settings, fontVersion])
}
