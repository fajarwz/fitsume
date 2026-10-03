import { describe, expect, it } from 'vitest'

import { createFakeMetrics } from '../test/fakeMetrics.js'
import { parseMarkdown } from './markdown.js'
import { measureBlocks, spaceBefore, skipsMarginAfter } from './measure.js'
import { DEFAULT_PADDING, DEFAULT_SPACING, HAIRLINE, LINE_HEIGHT_MIN, PAGE_HEIGHT, PAGE_WIDTH } from './page.js'

const pageOptions = (metrics, overrides = {}) => ({
  metrics,
  contentWidth: PAGE_WIDTH - DEFAULT_PADDING * 2,
  baseFontSize: 11,
  lineHeightMultiplier: LINE_HEIGHT_MIN,
  spacing: DEFAULT_SPACING,
  ...overrides,
})

describe('measureBlocks', () => {
  it('adds up a rule as separator + hairline + separator', () => {
    const height = measureBlocks(parseMarkdown('---'), pageOptions(createFakeMetrics()))

    expect(height).toBe(DEFAULT_SPACING.separator * 2 + HAIRLINE)
  })

  it('drops the preceding margin before a rule, so the gap is not doubled', () => {
    const blocks = parseMarkdown('# Name\n---')

    expect(skipsMarginAfter(blocks, 0)).toBe(true)
  })

  it('uses the user spacing for section gaps rather than a hard coded margin', () => {
    const blocks = parseMarkdown('# Name\nSummary\n## EXPERIENCE\n### Role')
    const base = measureBlocks(blocks, pageOptions(createFakeMetrics()))

    const wider = measureBlocks(
      blocks,
      pageOptions(createFakeMetrics(), {
        spacing: { ...DEFAULT_SPACING, section: DEFAULT_SPACING.section + 10 },
      }),
    )

    expect(wider - base).toBe(10)
  })

  it('uses the user spacing for item gaps too', () => {
    const blocks = parseMarkdown('## EXPERIENCE\n### Role A\n### Role B')
    const base = measureBlocks(blocks, pageOptions(createFakeMetrics()))

    const wider = measureBlocks(
      blocks,
      pageOptions(createFakeMetrics(), {
        spacing: { ...DEFAULT_SPACING, item: DEFAULT_SPACING.item + 5 },
      }),
    )

    expect(wider - base).toBe(5)
  })

  it('drops a margin when the next block brings its own space, so gaps never double up', () => {
    const options = pageOptions(createFakeMetrics())
    const blocks = parseMarkdown('# Name\nSummary text\n## EXPERIENCE')

    const title = blocks[0]
    const body = blocks[1]
    const section = blocks[2]

    expect(skipsMarginAfter(blocks, 1)).toBe(true)

    // Composed height == each part measured alone, except the body's own trailing
    // margin is gone (it would sit on top of the section's gap). If the two walks
    // ever stop collapsing this, the preview and the fit engine disagree.
    expect(measureBlocks(blocks, options)).toBe(
      measureBlocks([title], options) +
        measureBlocks([body], options) -
        body.marginBottom +
        measureBlocks([section], options),
    )
  })

  it('grows with the base font size', () => {
    const blocks = parseMarkdown('# Name\nSummary\n## EXPERIENCE\n### Role\n- did a thing')

    const small = measureBlocks(blocks, pageOptions(createFakeMetrics(), { baseFontSize: 8 }))
    const large = measureBlocks(blocks, pageOptions(createFakeMetrics(), { baseFontSize: 16 }))

    expect(large).toBeGreaterThan(small)
  })

  it('is zero for an empty document', () => {
    expect(measureBlocks([], pageOptions(createFakeMetrics()))).toBe(0)
  })

  it('fits a one-line document comfortably inside a page', () => {
    const height = measureBlocks(parseMarkdown('# Name'), pageOptions(createFakeMetrics()))

    expect(height).toBeLessThan(PAGE_HEIGHT)
  })
})

describe('spaceBefore', () => {
  it('maps the story-level gap names onto the user spacing', () => {
    expect(spaceBefore({ spaceBefore: 'section' }, DEFAULT_SPACING)).toBe(DEFAULT_SPACING.section)
    expect(spaceBefore({ spaceBefore: 'item' }, DEFAULT_SPACING)).toBe(DEFAULT_SPACING.item)
    expect(spaceBefore({}, DEFAULT_SPACING)).toBe(0)
  })
})
