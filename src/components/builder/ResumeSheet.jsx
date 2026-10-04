import { useEffect, useRef, useState } from 'react'

import Text from '../ui/Text.jsx'
import { POSITIONED_TYPE } from '../../lib/layout.js'
import { HAIRLINE, PAGE_HEIGHT, PAGE_WIDTH } from '../../lib/page.js'

/**
 * A4 sheets fitted to their space. Each line is absolutely positioned and `white-space:
 * pre`, so the preview is the same document the fit engine measured; the same elements
 * print at real A4 width. Page count is lib/paginate.js's business.
 */
const COLOR = {
  ink: 'var(--ink)',
  inkMuted: 'var(--ink-muted)',
  inkFaint: 'var(--ink-faint)',
}

/* Headroom: exact fit rounds up a hair and a scrollbar appears; the slack also keeps
   the page shadow from being clipped by the pane's edge. */
const FIT_SLACK = 0.92

/** Below this, the box is not a real pane (a hidden tab measures zero). */
const MIN_USABLE_HEIGHT = 40

export default function ResumeSheet({ pages, padding, stackRef, zoom = 1, onWheelZoom = null }) {
  const frame = useRef(null)
  const scrollRef = useRef(null)
  const [fit, setFit] = useState(1)

  useEffect(() => {
    const element = frame.current

    if (!element) return undefined

    const measure = () => {
      const { clientWidth: width, clientHeight: height } = element

      // Width zero means the pane is not on screen at all (a hidden tab); leaving the
      // last good fit alone is better than resetting to something wrong.
      if (!width) return

      // The padding around the stack is not page. Sizing the page to the padded width
      // makes it overflow the pane it is supposed to fit inside, which is what a phone
      // hit first: the fit was fine, the box it was given was not.
      const style = stackRef?.current ? window.getComputedStyle(stackRef.current) : null
      const padX = style ? parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) : 0
      const padY = style ? parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) : 0

      // A pane with width but no height is a layout the measurement cannot trust, so
      // fall back to the window it is carved out of rather than rendering the page
      // oversized.
      const usableHeight =
        height > MIN_USABLE_HEIGHT ? height : Math.max(240, window.innerHeight - 240)

      setFit(Math.min((width - padX) / PAGE_WIDTH, (usableHeight - padY) / PAGE_HEIGHT) * FIT_SLACK)
    }

    measure()

    if (typeof ResizeObserver === 'undefined') return undefined

    const observer = new ResizeObserver(measure)

    observer.observe(element)

    return () => observer.disconnect()
  }, [stackRef])

  // Ctrl+scroll (and a trackpad pinch, which arrives as Ctrl+wheel) zooms the page
  useEffect(() => {
    const element = scrollRef.current

    if (!element || !onWheelZoom) return undefined

    const onWheel = (event) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      onWheelZoom(event.deltaY < 0 ? 1 : -1)
    }

    element.addEventListener('wheel', onWheel, { passive: false })

    return () => element.removeEventListener('wheel', onWheel)
  }, [onWheelZoom])

  const scale = fit * zoom
  const many = pages.length > 1

  return (
    <div ref={frame} className="relative min-h-0 w-full flex-1">
      <div ref={scrollRef} className="absolute inset-0 flex overflow-auto bg-[var(--canvas)]">
        <div
          ref={stackRef}
          data-sheet-stack
          className="flex flex-col items-center gap-4"
          style={{ margin: 'auto' }}
        >
          {pages.map((page, index) => (
            <div key={index} className="flex shrink-0 flex-col items-center gap-1">
              <div
                data-page-wrap
                className="relative rounded-sm shadow-[var(--shadow-page)]"
                style={{ width: PAGE_WIDTH * scale, height: PAGE_HEIGHT * scale }}
              >
                <div
                  data-page
                  className="absolute left-0 top-0 overflow-hidden rounded-sm"
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
                        {/* Addresses render as runs so they are clickable; the text is what the fit engine
                            measured, keeping rendered line == fitted line. */}
                        {item.segments
                          ? item.segments.map((segment, segmentIndex) =>
                              segment.href ? (
                                <a
                                  key={segmentIndex}
                                  href={segment.href}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="text-inherit underline decoration-[var(--ink-faint)] underline-offset-2"
                                >
                                  {segment.text}
                                </a>
                              ) : (
                                <span key={segmentIndex}>{segment.text}</span>
                              ),
                            )
                          : item.text}
                      </div>
                    ),
                  )}
                </div>
              </div>

              {many ? (
                <Text as="span" data-no-print variant="11-regular" tone="muted" tabular>
                  {index + 1} / {pages.length}
                </Text>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
