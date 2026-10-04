import { describe, expect, it } from 'vitest'

import { BLOCK_TYPE, parseMarkdown } from './markdown.js'

const HEADER = ['# Rizky Pratama', 'Senior Software Engineer', 'Jakarta · rizky@example.com'].join(
  '\n',
)

describe('parseMarkdown', () => {
  it('returns nothing for empty or non-string input', () => {
    expect(parseMarkdown('')).toEqual([])
    expect(parseMarkdown(undefined)).toEqual([])
    expect(parseMarkdown(42)).toEqual([])
  })

  it('styles the three-line header: title, subtitle, then faint metadata', () => {
    const [title, subtitle, meta] = parseMarkdown(HEADER)

    expect(title).toMatchObject({ text: 'Rizky Pratama', fontScale: 1.5, bold: true })
    expect(subtitle).toMatchObject({
      text: 'Senior Software Engineer',
      fontScale: 1,
      bold: false,
      marginBottom: 6,
      color: 'inkMuted',
    })
    expect(meta).toMatchObject({
      text: 'Jakarta · rizky@example.com',
      fontScale: 0.8,
      color: 'inkFaint',
      marginBottom: 16,
    })
  })

  it('treats a section heading as a section gap and a later item as an item gap', () => {
    const blocks = parseMarkdown('## EXPERIENCE\n### Role A\n### Role B')

    expect(blocks[0]).toMatchObject({ text: 'EXPERIENCE', spaceBefore: 'section', fontScale: 0.85 })
    expect(blocks[2]).toMatchObject({ text: 'Role B', spaceBefore: 'item', bold: true })
  })

  it('gives the first item under a section no extra gap, because the section already spaced it', () => {
    const blocks = parseMarkdown('## EXPERIENCE\n### Engineer — Acme\n2021 – Present')

    expect(blocks[1]).toMatchObject({ text: 'Engineer — Acme', bold: true })
    expect(blocks[1].spaceBefore).toBeUndefined()
    expect(blocks[1].marginBottom).toBe(2)
  })

  it('styles the line under an item as tight metadata, distinct from the header metadata', () => {
    const blocks = parseMarkdown('## EXPERIENCE\n### Engineer — Acme\n2021 – Present\n- shipped it')

    const itemMeta = blocks[2]

    expect(itemMeta).toMatchObject({ text: '2021 – Present', color: 'inkFaint', fontScale: 0.8 })
    // Tighter than the header's metadata line (16). Collapsing these two into one
    // style silently changes the height of every resume with job dates.
    expect(itemMeta.marginBottom).toBe(6)
  })

  it('turns bullets into bullet blocks with a real glyph', () => {
    const blocks = parseMarkdown('- shipped it\n- and this')

    expect(blocks[0]).toMatchObject({
      text: '\u2022 shipped it',
      color: 'inkMuted',
      marginBottom: 3,
    })
    expect(blocks[1].text).toBe('\u2022 and this')
  })

  it('turns --- into a rule block', () => {
    const blocks = parseMarkdown('# Name\n---\nbody')

    expect(blocks[1].type).toBe(BLOCK_TYPE.rule)
  })

  it('treats a paragraph as body text', () => {
    const blocks = parseMarkdown('Just a summary paragraph.')

    expect(blocks[0]).toMatchObject({
      text: 'Just a summary paragraph.',
      color: 'ink',
      marginBottom: 6,
    })
    expect(blocks[0].spaceBefore).toBeUndefined()
  })

  it('ignores blank lines', () => {
    expect(parseMarkdown('\n\n# Name\n\n\ntext\n\n')).toHaveLength(2)
  })

  it('does not mistake an unspaced hash for a heading', () => {
    const blocks = parseMarkdown('#NotAHeading\n##AlsoNot')

    expect(blocks[0].fontScale).toBe(1)
    expect(blocks[0].color).toBe('ink')
  })

  it('keeps a body line after a bullet as body text, not metadata', () => {
    const blocks = parseMarkdown('- a bullet\nplain paragraph')

    expect(blocks[1].color).toBe('ink')
    expect(blocks[1].marginBottom).toBe(6)
  })

  it('resolves bracketed links into labels with printed-text offsets', () => {
    const blocks = parseMarkdown('Contact [GitHub](https://github.com) and [Blog](https://blog.dev) now')

    expect(blocks[0].text).toBe('Contact GitHub and Blog now')
    expect(blocks[0].labels).toEqual([
      { text: 'GitHub', href: 'https://github.com', start: 8 },
      { text: 'Blog', href: 'https://blog.dev', start: 19 },
    ])
  })

  it('leaves an unresolvable link address exactly as typed, without a label', () => {
    const blocks = parseMarkdown('See [Thing](notalink)')

    expect(blocks[0].text).toBe('See [Thing](notalink)')
    expect(blocks[0].labels).toBeUndefined()
  })

  it('drops an unresolvable link but still resolves the others on the same line', () => {
    const blocks = parseMarkdown('[Gone](nope) and [Real](https://example.com)')

    expect(blocks[0].text).toBe('[Gone](nope) and Real')
    expect(blocks[0].labels).toEqual([{ text: 'Real', href: 'https://example.com', start: 17 }])
  })

  it('parses the shipped samples without throwing', async () => {
    const { SAMPLES } = await import('./samples.js')

    for (const sample of SAMPLES) {
      const blocks = parseMarkdown(sample.markdown)

      expect(blocks.length).toBeGreaterThan(4)
      expect(blocks[0].fontScale).toBe(1.5)
    }
  })
})
