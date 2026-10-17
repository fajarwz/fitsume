import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  A4_PRINT_HEIGHT_PX,
  A4_PRINT_WIDTH_PX,
  PRINT_SCALE,
  exportToPdf,
  printTitleFor,
} from './pdf.ts'
import { PAGE_WIDTH } from './page.ts'

const MARKDOWN_A = '# Ada Lovelace\nMathematician\nLondon'
const MARKDOWN_B = '# Rizky Pratama\nSenior Software Engineer\nJakarta'

/** The app shell, plus the print document PrintSheet mounts on <body>. */
function buildDom({ printDocument = true } = {}) {
  document.body.innerHTML = [
    '<div id="shell">editor and controls</div>',
    printDocument ? '<div id="print" data-print-root></div>' : '',
  ].join('')

  return { shell: document.getElementById('shell')!, print: document.getElementById('print') }
}

describe('printTitleFor', () => {
  it('names the file after the resume', () => {
    expect(printTitleFor('# Ada Lovelace\nMathematician')).toBe('Ada Lovelace Resume')
  })

  it('does not produce "Resume Resume"', () => {
    expect(printTitleFor('no heading here')).toBe('Resume')
    expect(printTitleFor('')).toBe('Resume')
  })
})

describe('print geometry', () => {
  it('scales the sheet page up to A4 print width', () => {
    expect(PRINT_SCALE * PAGE_WIDTH).toBeCloseTo(A4_PRINT_WIDTH_PX, 6)
  })

  it('stays under the millimetre ratio, so no page spills a blank sheet after it', () => {
    expect(A4_PRINT_HEIGHT_PX).toBeLessThan(A4_PRINT_WIDTH_PX * (297 / 210))
  })
})

describe('exportToPdf', () => {
  let dom: ReturnType<typeof buildDom>
  let print: any

  beforeEach(() => {
    dom = buildDom()
    print = vi.fn()
    document.title = 'Fitsume'
  })

  it('does nothing without a print document to print', () => {
    buildDom({ printDocument: false })

    expect(exportToPdf({ markdown: MARKDOWN_A, print })).toEqual({
      printed: false,
      restored: false,
    })
    expect(print).not.toHaveBeenCalled()
  })

  it('prints once, and leaves the app alone', () => {
    exportToPdf({ markdown: MARKDOWN_A, print })

    expect(print).toHaveBeenCalledTimes(1)
    // The export restages nothing, so it cannot disturb the preview behind it.
    expect(dom.shell.style.display).toBe('')
    expect(document.title).toBe('Fitsume')
  })

  it('names the document after the current resume, not the first one it ever saw', () => {
    // This two-export sequence is the regression: the previous implementation
    // captured the markdown in a callback that never changed, so the second
    // export was still named after the first document.
    const titles: string[] = []

    const capture = () => titles.push(document.title)

    exportToPdf({ markdown: MARKDOWN_A, print: capture })
    exportToPdf({ markdown: MARKDOWN_B, print: capture })

    expect(titles).toEqual(['Ada Lovelace Resume', 'Rizky Pratama Resume'])
    // ...and the app's own title comes back afterwards.
    expect(document.title).toBe('Fitsume')
  })

  it('puts the title back even when printing throws', () => {
    const throwing = () => {
      throw new Error('printer on fire')
    }

    expect(() => exportToPdf({ markdown: MARKDOWN_A, print: throwing })).toThrow('printer on fire')

    expect(document.title).toBe('Fitsume')
  })

  it('is safe to restore twice, because afterprint may also fire', () => {
    let afterPrint: any

    exportToPdf({
      markdown: MARKDOWN_A,
      print: () => {
        afterPrint = window.onafterprint
      },
    })

    expect(typeof afterPrint).toBe('function')
    expect(() => afterPrint()).not.toThrow()
    expect(document.title).toBe('Fitsume')
  })

  it('uses win.print when no callback is given, and still restores', () => {
    const winPrint = vi.fn()

    window.print = winPrint as any

    exportToPdf({ markdown: MARKDOWN_A })

    expect(winPrint).toHaveBeenCalledTimes(1)
    expect(document.title).toBe('Fitsume')
  })

  it('refuses to run when there is no document', () => {
    const result = exportToPdf({ doc: null, markdown: MARKDOWN_A, print })

    expect(result).toEqual({ printed: false, restored: false })
    expect(print).not.toHaveBeenCalled()
  })
})
