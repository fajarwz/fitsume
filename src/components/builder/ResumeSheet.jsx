import { useEffect, useRef, useState } from 'react'

import { POSITIONED_TYPE } from '../../lib/layout.js'
import { HAIRLINE, PAGE_HEIGHT, PAGE_WIDTH } from '../../lib/page.js'

/**
 * The A4 sheets, fitted to the space they are given.
 *
 * Every line is absolutely positioned at the coordinates lib/layout.js produced, and
 * the text is set to `white-space: pre` so the browser cannot re-wrap what the fit
 * engine already broke: the preview has to be the same document the measurement
 * describes, or the app lies about fitting.
 *
 * Each sheet is always 620x877 CSS px. On screen it is scaled down to fit the pane in
 * *both* directions, so a whole page is visible without scrolling, and `zoom`
 * multiplies that fit: at 1 the page fills the pane, past 1 the pane scrolls instead,
 * which is what zooming is for. The print path scales the same elements to real A4
 * width, so there is one document, not a preview copy and a print copy.
 *
 * How many sheets there are is not this component's business: lib/paginate.js decides,
 * and a document that fits one page simply arrives as one page. When there is more than
 * one, they stack down the pane with a count under each, because a page you cannot see
 * the end of is how the old single-sheet version lost its second half.
 */
const COLOR = {
  ink: 'var(--ink)',
  inkMuted: 'var(--ink-muted)',
  inkFaint: 'var(--ink-faint)',
}

/**
 * Slack left at the default scale.
 *
 * Fitting the pane *exactly* is what makes a scrollbar appear: the box is measured
 * in fractional pixels, the scale is a float, and the browser rounds the scaled page
 * up by a hair — which is enough for `overflow: auto` to decide there is something
 * to scroll. A few percent of headroom means the whole page is always visible, and
 * the page reads as a page rather than as a wall of text.
 */
const FIT_SLACK = 0.94

/** Below this, the box is not a real pane (a hidden tab measures zero). */
const MIN_USABLE_HEIGHT = 40

export default function ResumeSheet({ pages, padding, stackRef, zoom = 1 }) {
  const frame = useRef(null)
  const [fit, setFit] = useState(1)

  useEffect(() => {
    const element = frame.current

    if (!element) return undefined

    const measure = () => {
      const { clientWidth: width, clientHeight: height } = element

      // Width zero means the pane is not on screen at all (a hidden tab); leaving the
      // last good fit alone is better than resetting to something wrong.
      if (!width) return

      // A pane with width but no height is a layout the measurement cannot trust, so
      // fall back to the window it is carved out of rather than rendering the page
      // oversized.
      const usableHeight =
        height > MIN_USABLE_HEIGHT ? height : Math.max(240, window.innerHeight - 240)

      // Both axes, or the page is taller than the pane and the user scrolls. With
      // several pages this still holds page by page: one page fills the pane, and the
      // pane scrolls to the next.
      setFit(Math.min(width / PAGE_WIDTH, usableHeight / PAGE_HEIGHT) * FIT_SLACK)
    }

    measure()

    if (typeof ResizeObserver === 'undefined') return undefined

    const observer = new ResizeObserver(measure)

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  const scale = fit * zoom
  const many = pages.length > 1

  return (
    <div ref={frame} className="relative h-full w-full">
      {/* The box that gets measured is this outer element, and its size comes from the
          layout above. The scroll layer is inside it and absolutely positioned, so a
          scrollbar appearing when zoomed in cannot change what was measured — that
          feedback loop is what let the page change size without a click. */}
      <div className="absolute inset-0 flex overflow-auto">
        {/* margin:auto centres the stack while it fits and stops centring once it does
            not, which is the one arrangement that both centres and scrolls. */}
        <div
          ref={stackRef}
          data-sheet-stack
          className="flex flex-col items-center gap-4 p-2"
          style={{ margin: 'auto' }}
        >
          {pages.map((page, index) => (
            <div key={index} className="flex shrink-0 flex-col items-center gap-1">
              <div
                className="relative"
                style={{ width: PAGE_WIDTH * scale, height: PAGE_HEIGHT * scale }}
              >
                <div
                  data-page
                  className="absolute left-0 top-0 overflow-hidden rounded-sm shadow-[2px_2px_6px_rgba(0,0,0,0.28)]"
                  style={{
                    width: PAGE_WIDTH,
                    height: PAGE_HEIGHT,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    background: 'var(--paper)',
                    color: 'var(--ink)',
                  }}
                >
                  <div
                    data-no-print
                    className="pointer-events-none absolute border border-dashed"
                    style={{ inset: padding, borderColor: 'var(--ink-rule)' }}
                  />

                  {page.items.map((item, itemIndex) =>
                    item.type === POSITIONED_TYPE.rule ? (
                      <div
                        key={itemIndex}
                        style={{
                          position: 'absolute',
                          left: padding,
                          top: item.y,
                          width: PAGE_WIDTH - padding * 2,
                          height: HAIRLINE,
                          background: 'var(--ink-rule)',
                        }}
                      />
                    ) : (
                      <div
                        key={itemIndex}
                        style={{
                          position: 'absolute',
                          left: item.x,
                          top: item.y,
                          font: item.font,
                          lineHeight: `${item.lineHeight}px`,
                          whiteSpace: 'pre',
                          color: COLOR[item.color] ?? COLOR.ink,
                        }}
                      >
                        {item.text}
                      </div>
                    ),
                  )}
                </div>
              </div>

              {many ? (
                <span
                  data-no-print
                  className="text-[10px] tabular-nums text-[var(--muted-foreground)]"
                >
                  {index + 1} / {pages.length}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
