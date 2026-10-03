import { describe, expect, it } from 'vitest'

import { createFakeMetrics } from '../test/fakeMetrics.js'
import { contentBottom, layoutBlocks, POSITIONED_TYPE } from './layout.js'
import { measureBlocks } from './measure.js'
import { parseMarkdown } from './markdown.js'
import { DEFAULT_PADDING, DEFAULT_SPACING, HAIRLINE, LINE_HEIGHT_MIN, PAGE_WIDTH } from './page.js'

const options = (metrics, overrides = {}) => ({
  metrics,
  contentWidth: PAGE_WIDTH - DEFAULT_PADDING * 2,
  padding: DEFAULT_PADDING,
  baseFontSize: 11,
  lineHeightMultiplier: LINE_HEIGHT_MIN,
  spacing: DEFAULT_SPACING,
  ...overrides,
})

const LONG = `# Rizky Pratama
Senior Software Engineer
Jakarta · rizky@example.com

---

I build the parts of a product nobody notices until they break.

## EXPERIENCE

### Senior Engineer — Nusantara Labs
2021 – Present
- Cut p99 latency from 850ms to 140ms
- Designed the idempotency layer that ended double charges

## SKILLS

Go · PostgreSQL · Kafka`

describe('layoutBlocks', () => {
  it('starts the first line at the page padding', () => {
    const opts = options(createFakeMetrics())
    const positioned = layoutBlocks(parseMarkdown('# Name'), opts)

    expect(positioned[0].y).toBe(DEFAULT_PADDING)
    expect(positioned[0].x).toBe(DEFAULT_PADDING)
  })

  it('walks the document exactly the way measurement does', () => {
    const opts = options(createFakeMetrics())
    const blocks = parseMarkdown(LONG)
    const positioned = layoutBlocks(blocks, opts)
    const lastBlock = blocks[blocks.length - 1]

    // Both walks agree, except for whatever trailing margin follows the final
    // line — there is no next block to space against. This is the guard against
    // the measure/render divergence that would make the app lie about fitting.
    expect(contentBottom(positioned)).toBe(
      DEFAULT_PADDING + measureBlocks(blocks, opts) - lastBlock.marginBottom,
    )
  })

  it('never lets two lines overlap', () => {
    const positioned = layoutBlocks(parseMarkdown(LONG), options(createFakeMetrics()))
    const lines = positioned.filter((item) => item.type === POSITIONED_TYPE.line)

    for (let index = 1; index < lines.length; index += 1) {
      const previous = lines[index - 1]
      const current = lines[index]

      expect(current.y).toBeGreaterThanOrEqual(previous.y + previous.lineHeight)
    }
  })

  it('puts a separator gap on both sides of a rule', () => {
    const opts = options(createFakeMetrics())
    const positioned = layoutBlocks(parseMarkdown('text before\n---\ntext after'), opts)
    const rule = positioned.find((item) => item.type === POSITIONED_TYPE.rule)
    const lines = positioned.filter((item) => item.type === POSITIONED_TYPE.line)

    expect(rule).toBeDefined()
    expect(lines).toHaveLength(2)

    const [before, after] = lines

    expect(rule.y - (before.y + before.lineHeight)).toBeCloseTo(opts.spacing.separator, 6)
    expect(after.y - (rule.y + HAIRLINE)).toBeCloseTo(opts.spacing.separator, 6)
  })

  it('wraps into more lines as the font grows', () => {
    const blocks = parseMarkdown(LONG)

    const small = layoutBlocks(blocks, options(createFakeMetrics(), { baseFontSize: 8 }))
    const large = layoutBlocks(blocks, options(createFakeMetrics(), { baseFontSize: 18 }))

    expect(large.length).toBeGreaterThan(small.length)
  })

  it('keeps colours semantic, so the renderer resolves them from tokens', () => {
    const positioned = layoutBlocks(parseMarkdown('# Name\nRole\nJakarta\nbody'), options(createFakeMetrics()))

    expect(positioned.map((item) => item.color)).toEqual(['ink', 'inkMuted', 'inkFaint', 'ink'])
  })

  it('carries the font shorthand and line height through for the renderer', () => {
    const opts = options(createFakeMetrics(), { baseFontSize: 11, lineHeightMultiplier: 1.4 })
    const [first] = layoutBlocks(parseMarkdown('# Name'), opts)

    expect(first.font).toContain('bold 16.5px')
    expect(first.fontSize).toBeCloseTo(16.5)
    expect(first.lineHeight).toBeCloseTo(16.5 * 1.4)
    expect(first.bold).toBe(true)
  })

  it('is empty for an empty document', () => {
    expect(layoutBlocks([], options(createFakeMetrics()))).toEqual([])
    expect(contentBottom([])).toBe(0)
  })
})
