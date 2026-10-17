import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import PrintSheet from './PrintSheet.tsx'
import type { PositionedLine } from '../../lib/layout.ts'
import { A4_PRINT_HEIGHT_PX, A4_PRINT_WIDTH_PX, PRINT_SCALE } from '../../lib/pdf.ts'
import { PAGE_HEIGHT, PAGE_WIDTH } from '../../lib/page.ts'

const line = (text: string, y = 40): PositionedLine => ({
  type: 'line',
  text,
  x: 40,
  y,
  font: '14px Geist',
  fontSize: 14,
  lineHeight: 21,
  bold: false,
  color: 'ink',
  keepWithNext: false,
})

const page = (text: string) => ({ items: [line(text)] })

const boxes = () => Array.from(document.body.querySelectorAll<HTMLElement>('[data-print-page]'))

afterEach(cleanup)

describe('PrintSheet', () => {
  it('mounts the print document on <body>, outside the app shell', () => {
    const { container } = render(<PrintSheet pages={[page('Ada Lovelace')]} padding={40} />)
    const root = document.body.querySelector('[data-print-root]')!

    expect(root).not.toBeNull()
    // Print CSS hides the shell and shows this, so it must not be inside the app.
    expect(root.parentElement).toBe(document.body)
    expect(container.contains(root)).toBe(false)
  })

  it('draws one real A4 box per page, in order', () => {
    render(<PrintSheet pages={[page('one'), page('two')]} padding={40} />)

    expect(boxes()).toHaveLength(2)
    expect(boxes()[0].textContent).toContain('one')
    expect(boxes()[1].textContent).toContain('two')

    for (const box of boxes()) {
      expect(parseFloat(box.style.width)).toBe(A4_PRINT_WIDTH_PX)
      expect(parseFloat(box.style.height)).toBe(A4_PRINT_HEIGHT_PX)
    }
  })

  it('breaks after every page but the last', () => {
    render(<PrintSheet pages={[page('one'), page('two'), page('three')]} padding={40} />)

    expect(boxes().map((box) => box.getAttribute('data-page-break'))).toEqual([
      'after',
      'after',
      null,
    ])
  })

  it('scales the sheet page up to A4 width inside the print box', () => {
    render(<PrintSheet pages={[page('one')]} padding={40} />)
    const sheet = document.body.querySelector<HTMLElement>('[data-print-page] [data-page]')!

    expect(sheet.style.width).toBe(`${PAGE_WIDTH}px`)
    expect(sheet.style.height).toBe(`${PAGE_HEIGHT}px`)
    expect(sheet.style.transform).toBe(`scale(${PRINT_SCALE})`)
    expect(sheet.style.transformOrigin).toBe('top left')
  })

  it('carries no preview chrome: no margin guide, no page caption', () => {
    render(<PrintSheet pages={[page('one')]} padding={40} />)
    const root = document.body.querySelector('[data-print-root]')!

    expect(root.querySelector('[class*="border-dashed"]')).toBeNull()
    expect(root.querySelector('[class*="layers"]')).toBeNull()
  })

  it('keeps addresses as links, so the exported PDF stays clickable', () => {
    render(
      <PrintSheet
        pages={[
          {
            items: [
              {
                ...line('me@example.com'),
                segments: [{ text: 'me@example.com', href: 'mailto:me@example.com' }],
              },
            ],
          },
        ]}
        padding={40}
      />,
    )

    expect(document.body.querySelector('[data-print-root] a')?.getAttribute('href')).toBe(
      'mailto:me@example.com',
    )
  })

  it('draws nothing when there is no page', () => {
    render(<PrintSheet pages={[]} padding={40} />)

    expect(document.body.querySelector('[data-print-root]')).toBeNull()
  })
})
