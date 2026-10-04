import { describe, expect, it } from 'vitest'

import { POSITIONED_TYPE } from './layout.ts'
import { HAIRLINE } from './page.ts'
import { paginateItems, type PaginateLineItem } from './paginate.ts'

const line = (y: number, lineHeight: number, extra: Partial<PaginateLineItem> = {}) => ({
  type: POSITIONED_TYPE.line,
  y,
  lineHeight,
  ...extra,
})

describe('paginateItems', () => {
  it('turns an empty flow into one blank sheet', () => {
    expect(paginateItems([])).toEqual([{ items: [] }])
  })

  it('places a single item at the top of one page', () => {
    const pages = paginateItems([line(10, 20)])

    expect(pages).toHaveLength(1)
    expect(pages[0].items[0].y).toBe(0)
    expect((pages[0].items[0] as PaginateLineItem).lineHeight).toBe(20)
  })

  it('keeps items that fit on the same page, preserving their flow gaps', () => {
    const pages = paginateItems([line(0, 30), line(40, 10)])

    expect(pages).toHaveLength(1)
    expect(pages[0].items).toHaveLength(2)
    expect(pages[0].items[0].y).toBe(0)
    expect(pages[0].items[1].y).toBe(40)
  })

  it('starts a new page when a later item runs past the usable band', () => {
    const pages = paginateItems([line(0, 40), line(45, 40)], { pageHeight: 50 })

    expect(pages).toHaveLength(2)
    expect(pages[0].items).toHaveLength(1)
    expect(pages[1].items).toHaveLength(1)
    expect(pages[1].items[0].y).toBe(0)
  })

  it('drops the inter-item spacing across a page break', () => {
    const pages = paginateItems([line(0, 40), line(80, 40)], { pageHeight: 60 })

    expect(pages).toHaveLength(2)
    // On its own page the item starts at the padding, not 40 pixels lower.
    expect(pages[0].items[0].y).toBe(0)
    expect(pages[1].items[0].y).toBe(0)
  })

  it('leaves a headed line stranded with the text it introduces', () => {
    const pages = paginateItems(
      [line(0, 10), line(15, 40, { keepWithNext: true }), line(60, 50)],
      {
        pageHeight: 100,
      },
    )

    expect(pages).toHaveLength(2)
    expect(pages[0].items).toHaveLength(1)
    expect(pages[1].items).toHaveLength(2)
    expect(pages[1].items[0].y).toBe(0)
    expect((pages[1].items[0] as PaginateLineItem).keepWithNext).toBe(true)
  })

  it('keeps a heading on the page when its text also fits', () => {
    const pages = paginateItems(
      [line(0, 10), line(15, 20, { keepWithNext: true }), line(40, 10)],
      {
        pageHeight: 200,
      },
    )

    expect(pages).toHaveLength(1)
    expect(pages[0].items).toHaveLength(3)
  })

  it('sizes a rule item at the hairline height', () => {
    const pages = paginateItems([{ type: POSITIONED_TYPE.rule, y: 0 }, line(0, 20)])

    expect(pages[0].items[0].y).toBe(0)
    expect(pages[0].items[1].y).toBe(HAIRLINE)
  })

  it('treats a missing line height as zero', () => {
    const pages = paginateItems([{ type: POSITIONED_TYPE.line, y: 5 }])

    expect(pages[0].items[0].y).toBe(0)
  })

  it('clamps a negative gap to zero, in the flow and to the next item', () => {
    const pages = paginateItems([line(0, 20), line(10, 20), line(0, 20)])

    expect(pages).toHaveLength(1)
    expect(pages[0].items[1].y).toBe(20)
    expect(pages[0].items[2].y).toBe(40)
  })

  it('clamps a degenerate page to a one-pixel usable band', () => {
    const pages = paginateItems([line(0, 1), line(1, 1), line(2, 1)], {
      pageHeight: 10,
      padding: 6,
    })

    expect(pages).toHaveLength(3)
    expect(pages.every((page) => page.items.length === 1)).toBe(true)
  })
})