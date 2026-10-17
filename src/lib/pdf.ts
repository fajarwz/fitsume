import { PAGE_WIDTH } from './page.ts'
import { deriveTitle } from './title.ts'

/**
 * Print export.
 *
 * The browser's own print pipeline, no server and no PDF library, over the print document
 * alone: PrintSheet draws real A4 boxes outside the app shell, and print.css shows only those.
 * So there is very little left to do here — name the file after the resume, hand over, put the
 * title back. Nothing is restaged, so there is nothing to restore, which is what makes this
 * immune to the two things that used to go wrong: a print dialog that renders after the
 * restore has run, and the app's own background finding its way onto the page.
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

/** The browser names a downloaded PDF after the document title. */
export function printTitleFor(markdown: unknown): string {
  const name = deriveTitle(markdown)

  return name === 'Resume' ? name : `${name} Resume`
}

/**
 * `print` is injectable so the whole flow can be tested without opening a print dialog.
 * Returns whether the print ran and whether the title was put back.
 */
export function exportToPdf({
  markdown,
  doc = globalThis.document,
  print,
}: {
  markdown?: unknown
  doc?: any
  print?: (() => unknown) | null
} = {}): { printed: boolean; restored: boolean } {
  // No print document mounted means there is no page to draw: PrintSheet only mounts when
  // there is something to print, and this is the same condition, read from the DOM.
  if (!doc?.querySelector?.('[data-print-root]')) return { printed: false, restored: false }

  const win = doc.defaultView ?? globalThis
  const doPrint = print ?? (() => win.print?.())
  const savedTitle = doc.title
  const previousAfterPrint = win.onafterprint
  let restored = false

  doc.title = printTitleFor(markdown)

  const restore = () => {
    if (restored) return false

    restored = true
    doc.title = savedTitle
    win.onafterprint = previousAfterPrint

    return true
  }

  // Belt and braces: some browsers fire afterprint reliably, some do not, and print() itself
  // throws if the dialog cannot open at all.
  win.onafterprint = restore

  try {
    doPrint()
  } finally {
    restore()
  }

  return { printed: true, restored: true }
}
