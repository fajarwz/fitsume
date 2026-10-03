import { useEffect, useRef, useState } from 'react'

import { POSITIONED_TYPE } from '../../lib/layout.js'
import { HAIRLINE, PAGE_HEIGHT, PAGE_WIDTH } from '../../lib/page.js'

/**
 * The A4 sheet.
 *
 * Every line is absolutely positioned at the coordinates lib/layout.js produced,
 * and the text is set to `white-space: pre` so the browser cannot re-wrap what the
 * fit engine already broke: the preview has to be the same document the
 * measurement describes, or the app lies about fitting.
 *
 * The sheet itself is always 620px wide. The preview scales it to the column with
 * a transform, and the print path scales the same element to real A4 width — so
 * there is one sheet, not a preview copy and a print copy.
 */
const COLOR = {
  ink: 'var(--ink)',
  inkMuted: 'var(--ink-muted)',
  inkFaint: 'var(--ink-faint)',
}

export default function ResumeSheet({ positioned, padding, overflow = 0, sheetRef }) {
  const frame = useRef(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const element = frame.current

    if (!element) return undefined

    const measure = () => {
      if (!element.clientWidth) return

      setScale(Math.min(1, element.clientWidth / PAGE_WIDTH))
    }

    measure()

    if (typeof ResizeObserver === 'undefined') return undefined

    const observer = new ResizeObserver(measure)

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={frame} className="w-full">
      <div
        className="relative mx-auto"
        style={{ width: PAGE_WIDTH * scale, height: PAGE_HEIGHT * scale }}
      >
        <div
          ref={sheetRef}
          data-page
          className="absolute left-0 top-0 overflow-hidden rounded-sm shadow-[0_12px_40px_rgba(0,0,0,0.28)]"
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

          {positioned.map((item, index) =>
            item.type === POSITIONED_TYPE.rule ? (
              <div
                key={index}
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
                key={index}
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

          {overflow > 0 ? (
            <div
              data-no-print
              className="absolute inset-x-0 bottom-0 flex items-center justify-center py-1 text-[11px] font-medium"
              style={{ background: 'rgba(185,28,28,0.12)', color: '#b91c1c' }}
            >
              {overflow}px past the bottom of the page
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
