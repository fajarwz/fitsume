import { PAGE_WIDTH } from './page.js'
import { deriveTitle } from './title.js'

/**
 * Print export.
 *
 * The browser's own print pipeline, no server and no PDF library. What makes it
 * fiddly is that the preview is a scaled, decorated, absolutely-positioned
 * imitation of a sheet, embedded in an app shell — so before printing, the sheets
 * have to be lifted out of that and placed at the top-left of the viewport at
 * exactly A4 width, with everything else hidden.
 *
 * With auto-fit off a document runs to as many pages as it needs, and printing only
 * the first would be the same crop the preview used to show. Every sheet is printed
 * as its own A4 box, in order, with a break between them.
 *
 * The whole thing is a save/restore pair, and the restore has to be total: it runs in
 * a `finally`, so a cancelled or failing print cannot leave the editor hidden, the
 * sheets wrapped, or the title wrong.
 *
 * The previous implementation derived the print title from a value captured in the
 * component's first render, which is why every exported PDF was named after the
 * first sample it ever loaded. Here the markdown is a parameter, so there is no
 * closure to go stale.
 */

/** A4 is 210mm wide; at the CSS reference of 96dpi that is 794px. */
export const A4_PRINT_WIDTH_PX = 794

export const PRINT_SCALE = A4_PRINT_WIDTH_PX / PAGE_WIDTH

/**
 * A4 at 96dpi is 794 x 1122.5. This is the millimetre ratio rounded down and then down
 * again by a pixel: rounding up is what spills a blank sheet after every page, and the
 * pixel costs nothing, because the bottom of a sheet is margin rather than content.
 */
export const A4_PRINT_HEIGHT_PX = Math.floor(A4_PRINT_WIDTH_PX * (297 / 210)) - 1

const PAGE_STYLE_PROPS = [
  'position',
  'top',
  'left',
  'transform',
  'transformOrigin',
  'boxShadow',
  'background',
]

const ANCESTOR_STYLE_PROPS = [
  'overflow',
  'transform',
  'position',
  'visibility',
  'background',
  'boxShadow',
]

/** The browser names a downloaded PDF after the document title. */
export function printTitleFor(markdown) {
  const name = deriveTitle(markdown)

  return name === 'Resume' ? name : `${name} Resume`
}

/**
 * Which sheets to print: an explicit list, a single page, or whatever the preview
 * currently holds.
 */
export function collectSheets({ container, page, pages } = {}) {
  if (Array.isArray(pages) && pages.length > 0) return pages.filter(Boolean)
  if (page) return [page]
  if (container?.querySelectorAll) return Array.from(container.querySelectorAll('[data-page]'))

  return []
}

/**
 * Restructures the DOM, prints, and puts it all back.
 *
 * `print` is injectable so the whole flow can be tested without opening a print
 * dialog. Returns whether the print ran and whether the DOM was restored.
 */
export function exportToPdf({
  container,
  page,
  pages,
  markdown,
  doc = globalThis.document,
  print,
} = {}) {
  const sheets = collectSheets({ container, page, pages })

  if (sheets.length === 0 || !doc) return { printed: false, restored: false }

  const win = doc.defaultView ?? globalThis
  const doPrint = print ?? (() => win.print?.())

  const savedElementStyles = []
  const savedDisplays = []
  const printed = []
  const savedTitle = doc.title

  const rememberStyle = (el, props) => {
    const snapshot = {}

    for (const prop of props) snapshot[prop] = el.style[prop] ?? ''

    savedElementStyles.push({ el, snapshot })
  }

  const hide = (el) => {
    savedDisplays.push({ el, display: el.style.display ?? '' })
    el.style.display = 'none'
  }

  // Every node between a sheet and <body> is protected, because the sheets are
  // siblings of one another: hiding siblings naively would hide every page after the
  // first.
  const protectedNodes = new Set()
  const flattened = new Set()
  const hidden = new Set()

  for (const sheet of sheets) {
    for (let node = sheet; node && node !== doc.body; node = node.parentElement) {
      protectedNodes.add(node)
    }
  }

  const hideOnce = (el) => {
    if (hidden.has(el)) return

    hidden.add(el)
    hide(el)
  }

  const flatten = (el) => {
    if (flattened.has(el)) return

    flattened.add(el)

    rememberStyle(el, ANCESTOR_STYLE_PROPS)
    el.style.overflow = 'visible'
    el.style.transform = 'none'
    el.style.visibility = 'visible'
    el.style.background = 'none'
    // Normal flow is what lets the sheets paginate: a browser will not break pages
    // inside an absolutely positioned ancestor.
    el.style.position = 'static'
    // The ring and shadow drawn around each page in the preview are screen furniture,
    // and this box is the one that carries them.
    el.style.boxShadow = 'none'
  }

  // Every sheet's chain, not just the first one's: with several pages, each page sits
  // in a wrapper of its own with its own preview chrome, and walking only the first
  // chain would print the rest of it. The two Sets make repeat visits harmless, which
  // matters because restoring a style to the value it already had is how a preview ends
  // up quietly broken.
  for (const sheet of sheets) {
    let node = sheet
    let depth = 0

    while (node.parentElement && node !== doc.body && depth < 20) {
      const parent = node.parentElement

      for (const sibling of Array.from(parent.children)) {
        if (!protectedNodes.has(sibling)) hideOnce(sibling)
      }

      if (parent !== doc.body) flatten(parent)

      node = parent
      depth += 1
    }
  }

  // A transform scales what is drawn without changing the box that draws it, and the
  // box is what a page break has to come from. So each sheet is scaled inside a wrapper
  // the size of real A4, and the break is asked of the wrapper.
  for (const [index, sheet] of sheets.entries()) {
    const parent = sheet.parentElement
    const next = sheet.nextSibling

    if (!parent) continue

    const wrapper = doc.createElement('div')

    wrapper.setAttribute('data-print-sheet', '')
    // The break is declared in CSS rather than set as an inline style, because inline
    // page-break properties are the kind of thing a DOM stub silently drops.
    if (index < sheets.length - 1) wrapper.setAttribute('data-page-break', 'after')

    Object.assign(wrapper.style, {
      position: 'relative',
      width: `${A4_PRINT_WIDTH_PX}px`,
      height: `${A4_PRINT_HEIGHT_PX}px`,
      overflow: 'hidden',
      margin: '0',
      padding: '0',
      background: 'var(--paper)',
    })

    parent.insertBefore(wrapper, sheet)
    wrapper.appendChild(sheet)

    rememberStyle(sheet, PAGE_STYLE_PROPS)
    Object.assign(sheet.style, {
      position: 'absolute',
      top: '0px',
      left: '0px',
      transform: `scale(${PRINT_SCALE})`,
      transformOrigin: 'top left',
      boxShadow: 'none',
      background: 'var(--paper)',
    })

    printed.push({ sheet, parent, next, wrapper })
  }

  // Editor-only chrome: margin guides, page captions.
  for (const sheet of sheets) {
    for (const el of Array.from(sheet.querySelectorAll('[data-no-print]'))) hide(el)
  }

  doc.title = printTitleFor(markdown)

  const previousAfterPrint = win.onafterprint
  let restored = false

  const restore = () => {
    if (restored) return false

    restored = true

    for (const { sheet, parent, next, wrapper } of printed) {
      // Back into the element it came from, not into the wrapper's parent: the preview
      // layout has to survive the print.
      parent.insertBefore(sheet, next ?? null)
      wrapper.remove()
    }

    for (const { el, snapshot } of savedElementStyles) Object.assign(el.style, snapshot)
    for (const { el, display } of savedDisplays) el.style.display = display

    doc.title = savedTitle
    win.onafterprint = previousAfterPrint

    return true
  }

  // Belt and braces: some browsers fire afterprint reliably, some do not, and
  // print() itself throws if the dialog cannot open at all.
  win.onafterprint = restore

  try {
    doPrint()
  } finally {
    restore()
  }

  return { printed: true, restored: true }
}
