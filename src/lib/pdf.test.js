import { beforeEach, describe, expect, it, vi } from 'vitest'

import { A4_PRINT_WIDTH_PX, PRINT_SCALE, exportToPdf, printTitleFor } from './pdf.js'
import { PAGE_WIDTH } from './page.js'

const MARKDOWN_A = '# Ada Lovelace\nMathematician\nLondon'
const MARKDOWN_B = '# Rizky Pratama\nSenior Software Engineer\nJakarta'

function buildDom() {
  document.body.innerHTML = [
    '<div id="shell">',
    '<div id="chrome">editor and controls</div>',
    '<div id="preview">',
    '<div id="page">',
    '<div id="guide" data-no-print></div>',
    '</div>',
    '</div>',
    '</div>',
  ].join('')

  return {
    shell: document.getElementById('shell'),
    chrome: document.getElementById('chrome'),
    preview: document.getElementById('preview'),
    page: document.getElementById('page'),
    guide: document.getElementById('guide'),
  }
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

describe('exportToPdf', () => {
  let dom
  let print

  beforeEach(() => {
    dom = buildDom()
    print = vi.fn()
    document.title = 'Fitsume'
  })

  it('does nothing without a sheet to print', () => {
    expect(exportToPdf({ page: null, markdown: MARKDOWN_A, print })).toEqual({
      printed: false,
      restored: false,
    })
    expect(print).not.toHaveBeenCalled()
  })

  it('prints once', () => {
    exportToPdf({ page: dom.page, markdown: MARKDOWN_A, print })

    expect(print).toHaveBeenCalledTimes(1)
  })

  it('names the document after the current resume, not the first one it ever saw', () => {
    // This two-export sequence is the regression: the previous implementation
    // captured the markdown in a callback that never changed, so the second
    // export was still named after the first document.
    const titles = []

    const capture = () => titles.push(document.title)

    exportToPdf({ page: dom.page, markdown: MARKDOWN_A, print: capture })
    exportToPdf({ page: dom.page, markdown: MARKDOWN_B, print: capture })

    expect(titles).toEqual(['Ada Lovelace Resume', 'Rizky Pratama Resume'])
    // ...and the app's own title comes back afterwards.
    expect(document.title).toBe('Fitsume')
  })

  it('hides the rest of the app while printing, and brings it back', () => {
    exportToPdf({ page: dom.page, markdown: MARKDOWN_A, print })

    expect(dom.chrome.style.display).toBe('')
    expect(dom.shell.style.overflow).toBe('')
    expect(document.title).toBe('Fitsume')
  })

  it('flattens and un-scales the wrappers around the sheet', () => {
    exportToPdf({ page: dom.page, markdown: MARKDOWN_A, print })

    expect(dom.preview.style.overflow).toBe('')
    expect(dom.preview.style.transform).toBe('')
    expect(dom.page.style.position).toBe('')
    expect(dom.page.style.transform).toBe('')
  })

  it('restores an inline display a sibling already had, not the computed one', () => {
    // The old restore wrote the *computed* display back as an inline style, which
    // pinned layout values onto elements that had never set them.
    dom.chrome.style.display = 'flex'

    exportToPdf({ page: dom.page, markdown: MARKDOWN_A, print })

    expect(dom.chrome.style.display).toBe('flex')
  })

  it('hides editor-only chrome, and restores it', () => {
    exportToPdf({ page: dom.page, markdown: MARKDOWN_A, print })

    expect(dom.guide.style.display).toBe('')
  })

  it('puts the sheet at the top-left of the viewport at A4 width', () => {
    const observed = []

    exportToPdf({
      page: dom.page,
      markdown: MARKDOWN_A,
      print: () => {
        observed.push({
          position: dom.page.style.position,
          top: dom.page.style.top,
          left: dom.page.style.left,
          transform: dom.page.style.transform,
          transformOrigin: dom.page.style.transformOrigin,
        })
      },
    })

    expect(observed[0]).toEqual({
      position: 'fixed',
      top: '0px',
      left: '0px',
      transform: `scale(${PRINT_SCALE})`,
      transformOrigin: 'top left',
    })
    expect(PRINT_SCALE * PAGE_WIDTH).toBeCloseTo(A4_PRINT_WIDTH_PX, 6)
  })

  it('restores everything even when printing throws', () => {
    const throwing = () => {
      throw new Error('printer on fire')
    }

    expect(() => exportToPdf({ page: dom.page, markdown: MARKDOWN_A, print: throwing })).toThrow(
      'printer on fire',
    )

    expect(dom.chrome.style.display).toBe('')
    expect(dom.page.style.position).toBe('')
    expect(document.title).toBe('Fitsume')
  })

  it('never touches <head> or <html>', () => {
    exportToPdf({ page: dom.page, markdown: MARKDOWN_A, print })

    expect(document.head.style.display).toBe('')
    expect(document.documentElement.style.display).toBe('')
  })

  it('is safe to restore twice, because afterprint may also fire', () => {
    const { page } = dom
    let afterPrint

    exportToPdf({
      page,
      markdown: MARKDOWN_A,
      print: () => {
        afterPrint = window.onafterprint
      },
    })

    expect(typeof afterPrint).toBe('function')
    expect(() => afterPrint()).not.toThrow()
    expect(document.title).toBe('Fitsume')
  })
})
