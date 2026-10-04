import { POSITIONED_TYPE } from './layout.ts'
import { HAIRLINE, PAGE_HEIGHT } from './page.ts'

/**
 * Splitting the laid out document into pages.
 *
 * With auto-fit off, the user's own font size stands and the document is as long as it
 * is. Keeping that on one sheet means clipping whatever passes the bottom edge, which
 * is not a page, it is a crop. Here the same stream of absolutely positioned items is
 * re-flowed onto as many sheets as it needs.
 *
 * The rules are the ordinary ones for a document:
 *
 *   - a page holds one full band of content, from the top margin to the bottom margin
 *   - the spacing that would have sat between two items is dropped when it lands on a
 *     page break, because the page margin is what separates them now
 *   - a heading is not left alone at the foot of a page: if it fits but nothing it
 *     introduces does, it goes down with them
 *
 * Items arrive already positioned in one continuous flow, which is what makes this
 * arithmetic rather than more measurement.
 */

/**
 * A line item as pagination needs it. `lineHeight` is optional because the same
 * item stream is consumed by callers that never set it and treat it as zero.
 */
export interface PaginateLineItem {
  type: 'line'
  y: number
  lineHeight?: number
  keepWithNext?: boolean
}

export interface PaginateRuleItem {
  type: 'rule'
  y: number
}

export type PaginateItem = PaginateLineItem | PaginateRuleItem

export interface PaginatedPage {
  items: PaginateItem[]
}

const itemHeight = (item: PaginateItem): number =>
  item.type === POSITIONED_TYPE.rule ? HAIRLINE : (item.lineHeight ?? 0)

const gapBetween = (previousBottom: number | null, item: PaginateItem): number =>
  previousBottom === null ? 0 : Math.max(0, item.y - previousBottom)

export function paginateItems(
  positioned: PaginateItem[],
  { padding = 0, pageHeight = PAGE_HEIGHT }: { padding?: number; pageHeight?: number } = {},
): PaginatedPage[] {
  // The band every page gets to fill. A page whose margins leave nothing is a
  // degenerate setting, not a licence to loop forever.
  const usable = Math.max(1, pageHeight - padding * 2)
  const pages: PaginatedPage[] = []

  let items: PaginateItem[] = []
  let used = 0
  // Absolute flow coordinate of the last item placed, so spacing survives a page
  // break and is not double counted across one.
  let bottom: number | null = null

  const flush = () => {
    if (items.length > 0) pages.push({ items })

    items = []
    used = 0
    bottom = null
  }

  for (let index = 0; index < positioned.length; index += 1) {
    const item = positioned[index]

    if (bottom !== null) {
      const height = itemHeight(item)
      const gap = gapBetween(bottom, item)
      const next = positioned[index + 1]
      const nextGap = next ? gapBetween(item.y + height, next) : 0
      const runsPast = used + gap + height > usable
      const strandedHeading =
        item.type === POSITIONED_TYPE.line &&
        item.keepWithNext === true &&
        next !== undefined &&
        used + gap + height + nextGap + itemHeight(next) > usable

      if (runsPast || strandedHeading) flush()
    }

    const gap = gapBetween(bottom, item)

    items.push({ ...item, y: padding + used + gap })
    used += gap + itemHeight(item)
    bottom = item.y + itemHeight(item)
  }

  flush()

  // An empty document is still one sheet: the preview shows the page you are writing on.
  return pages.length > 0 ? pages : [{ items: [] }]
}