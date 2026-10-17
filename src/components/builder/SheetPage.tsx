import { POSITIONED_TYPE } from '../../lib/layout.ts'
import type { PositionedItem } from '../../lib/layout.ts'
import { HAIRLINE, PAGE_WIDTH } from '../../lib/page.ts'

/**
 * One A4 page of positioned items. Shared by the preview and the print document, so what
 * prints is drawn by the same code that is on screen: preview and export cannot drift.
 */
const COLOR: Record<string, string> = {
  ink: 'var(--ink)',
  inkMuted: 'var(--ink-muted)',
  inkFaint: 'var(--ink-faint)',
}

export interface SheetPageProps {
  items: PositionedItem[]
  padding: number
}

export default function SheetPage({ items, padding }: SheetPageProps) {
  return (
    <>
      {items.map((item, index) =>
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
    </>
  )
}
