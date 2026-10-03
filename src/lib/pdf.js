import { PAGE_WIDTH } from './page.js'
import { deriveTitle } from './title.js'

/**
 * Print export.
 *
 * The browser's own print pipeline, no server and no PDF library. What makes it
 * fiddly is that the preview is a scaled, decorated, absolutely-positioned
 * imitation of a sheet, embedded in an app shell — so before printing, the sheet
 * has to be lifted out of that and placed at the top-left of the viewport at
 * exactly A4 width, with everything else hidden.
 *
 * The whole thing is a save/restore pair, and the restore has to be total: it
 * runs in a `finally`, so a cancelled or failing print cannot leave the editor
 * hidden or the title wrong.
 *
 * The previous implementation derived the print title from a value captured in
 * the component's first render, which is why every exported PDF was named after
 * the first sample it ever loaded. Here the markdown is a parameter, so there is
 * no closure to go stale.
 */

/** A4 is 210mm wide; at the CSS reference of 96dpi that is 794px. */
export const A4_PRINT_WIDTH_PX = 794

export const PRINT_SCALE = A4_PRINT_WIDTH_PX / PAGE_WIDTH

const PAGE_STYLE_PROPS = [
  'position',
  'top',
  'left',
  'transform',
  'transformOrigin',
  'boxShadow',
  'background',
]

const ANCESTOR_STYLE_PROPS = ['overflow', 'transform', 'position', 'visibility', 'background']

/** The browser names a downloaded PDF after the document title. */
export function printTitleFor(markdown) {
  const name = deriveTitle(markdown)

  return name === 'Resume' ? name : `${name} Resume`
}

/**
 * Restructures the DOM, prints, and puts it all back.
 *
 * `print` is injectable so the whole flow can be tested without opening a print
 * dialog. Returns whether the print ran and whether the DOM was restored.
 */
export function exportToPdf({ page, markdown, doc = globalThis.document, print } = {}) {
  if (!page || !doc) return { printed: false, restored: false }

  const win = doc.defaultView ?? globalThis
  const doPrint = print ?? (() => win.print?.())

  const savedElementStyles = []
  const savedDisplays = []
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

  // Walk from the sheet up to (but never including) <body>: hide every sibling on
  // the way, and flatten the wrappers in between, which are overflow:hidden and
  // scaled for the preview.
  let current = page
  let ancestors = 0

  while (current.parentElement && current !== doc.body && ancestors < 20) {
    const parent = current.parentElement

    for (const sibling of Array.from(parent.children)) {
      if (sibling !== current) hide(sibling)
    }

    if (parent !== doc.body) {
      rememberStyle(parent, ANCESTOR_STYLE_PROPS)
      parent.style.overflow = 'visible'
      parent.style.transform = 'none'
      parent.style.visibility = 'visible'
      parent.style.background = 'none'
    }

    current = parent
    ancestors += 1
  }

  rememberStyle(page, PAGE_STYLE_PROPS)
  page.style.position = 'fixed'
  page.style.top = '0px'
  page.style.left = '0px'
  page.style.transform = `scale(${PRINT_SCALE})`
  page.style.transformOrigin = 'top left'
  page.style.boxShadow = 'none'
  page.style.background = 'var(--paper)'

  // Editor-only chrome: margin guides, the overflow overlay.
  for (const el of Array.from(page.querySelectorAll('[data-no-print]'))) hide(el)

  doc.title = printTitleFor(markdown)

  const previousAfterPrint = win.onafterprint
  let restored = false

  const restore = () => {
    if (restored) return false

    restored = true

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
