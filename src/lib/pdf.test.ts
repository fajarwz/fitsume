import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  A4_PRINT_WIDTH_PX,
  PRINT_SCALE,
  collectSheets,
  exportToPdf,
  printTitleFor,
} from './pdf.ts'
import { PAGE_WIDTH } from './page.ts'

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
    shell: document.getElementById('shell')!,
    chrome: document.getElementById('chrome')!,
    preview: document.getElementById('preview')!,
    page: document.getElementById('page')!,
    guide: document.getElementById('guide')!,
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
  let dom: ReturnType<typeof buildDom>
  let print: any

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
    const titles: string[] = []

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
    const observed: any[] = []

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
      position: 'absolute',
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

    expect(document.head!.style.display).toBe('')
    expect(document.documentElement.style.display).toBe('')
  })

  it('is safe to restore twice, because afterprint may also fire', () => {
    const { page } = dom
    let afterPrint: any

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

  it('uses win.print when no callback is given, and still restores', () => {
    const winPrint = vi.fn()
    window.print = winPrint as any

    exportToPdf({ page: dom.page, markdown: MARKDOWN_A })

    expect(winPrint).toHaveBeenCalledTimes(1)
    expect(dom.page.style.position).toBe('')
    expect(document.title).toBe('Fitsume')
  })

  it('refuses to run when there is no document', () => {
    const result = exportToPdf({ page: dom.page, doc: null, markdown: MARKDOWN_A, print })

    expect(result).toEqual({ printed: false, restored: false })
    expect(print).not.toHaveBeenCalled()
  })

  it('prints every page of a multi-page document as its own A4 box with a break', () => {
    // Each sheet lives in a wrapper of its own, mirroring the real preview DOM.
    document.body.innerHTML = [
      '<div id="shell2">',
      '<div id="chrome2">editor</div>',
      '<div id="preview2">',
      '<div class="pw"><div class="pg" id="p1">one</div></div>',
      '<div class="pw"><div class="pg" id="p2">two</div></div>',
      '</div>',
      '</div>',
    ].join('')
    const p1 = document.getElementById('p1')!
    const p2 = document.getElementById('p2')!

    const captured: Record<string, any> = {}
    const result = exportToPdf({
      pages: [p1, p2],
      markdown: MARKDOWN_A,
      print: () => {
        const wrappers = Array.from(document.querySelectorAll('[data-print-sheet]')) as HTMLElement[]
        captured.count = wrappers.length
        captured.firstBreak = wrappers[0]?.dataset.pageBreak
        captured.secondBreak = wrappers[1]?.dataset.pageBreak
        captured.widths = wrappers.map((w) => w.style.width)
      },
    })

    expect(result).toEqual({ printed: true, restored: true })
    // Each page is wrapped in its own A4-sized print-sheet box.
    expect(captured.count).toBe(2)
    // A break is declared after every sheet except the last.
    expect(captured.firstBreak).toBe('after')
    expect(captured.secondBreak).toBeUndefined()
    expect(captured.widths).toEqual([`${A4_PRINT_WIDTH_PX}px`, `${A4_PRINT_WIDTH_PX}px`])
    // ...and each page is back in its own wrapper, unwrapped.
    expect(p1.parentElement).toBe(document.querySelector('#shell2 .pw'))
    expect(p2.parentElement).toBe(document.querySelectorAll('#shell2 .pw')[1])
    expect(document.title).toBe('Fitsume')
  })

  it('survives a sheet that has been detached from the document', () => {
    const orphan = document.createElement('div')
    orphan.className = 'pg'
    orphan.textContent = 'lost'

    const result = exportToPdf({ page: orphan, markdown: MARKDOWN_A, print })

    // No parent, so it is skipped during wrapping, but the pipeline still runs.
    expect(result).toEqual({ printed: true, restored: true })
    expect(print).toHaveBeenCalledTimes(1)
    expect(orphan.parentElement).toBeNull()
    expect(document.title).toBe('Fitsume')
  })

  it('filters out blank entries from an explicit pages list', () => {
    let called = 0
    let sheetDetected: string | null | undefined = undefined

    exportToPdf({
      pages: [dom.page, null, undefined],
      markdown: MARKDOWN_A,
      print: () => {
        called += 1
        sheetDetected = dom.page.parentElement?.getAttribute('data-print-sheet')
      },
    })

    expect(called).toBe(1)
    expect(sheetDetected).not.toBeNull()
    expect(dom.page.parentElement).toBe(dom.preview)
    expect(document.title).toBe('Fitsume')
  })
})

describe('collectSheets', () => {
  const build = () => {
    document.body.innerHTML = [
      '<div id="preview"><div data-page id="k1">a</div><div data-page id="k2">b</div></div>',
    ].join('')
    return {
      preview: document.getElementById('preview')!,
      k1: document.getElementById('k1')!,
      k2: document.getElementById('k2')!,
    }
  }

  it('favours a non-empty pages list, dropping falsy entries', () => {
    const { k1, k2 } = build()
    expect(collectSheets({ pages: [k1, null, k2] })).toEqual([k1, k2])
  })

  it('falls back to a single page when pages is empty', () => {
    const dom = build()
    expect(collectSheets({ pages: [], page: dom.k2 })).toEqual([dom.k2])
  })

  it('reads sheets from the container as a last resort', () => {
    const dom = build()
    expect(collectSheets({ container: dom.preview, page: null })).toEqual([dom.k1, dom.k2])
  })

  it('returns nothing when the container has no querySelectorAll', () => {
    expect(collectSheets({ container: {} })).toEqual([])
  })
})