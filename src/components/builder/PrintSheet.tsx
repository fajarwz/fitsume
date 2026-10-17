import { createPortal } from 'react-dom'

import SheetPage from './SheetPage.tsx'
import { A4_PRINT_HEIGHT_PX, A4_PRINT_WIDTH_PX, PRINT_SCALE } from '../../lib/pdf.ts'
import { PAGE_HEIGHT, PAGE_WIDTH } from '../../lib/page.ts'
import type { ResumeSheetPage } from './ResumeSheet.tsx'

/**
 * The printed document: one real A4 box per page, at print width rather than preview scale.
 *
 * It is deliberately not the preview. This tree hangs off <body> through a portal, outside
 * the app shell, and is hidden on screen (print.css shows it and hides everything else).
 * That keeps the two apart in a way no amount of save/restore can: the export cannot pick up
 * the app's layout, its chrome or its theme, because none of it is an ancestor of this — the
 * theme's own background, which used to print as a coloured frame, is a case in point. And
 * because print CSS does the hiding, nothing has to be restaged while the print dialog is
 * open, so a dialog that renders late cannot catch the app mid-restore.
 */
export interface PrintSheetProps {
  pages: ResumeSheetPage[]
  padding: number
}

export default function PrintSheet({ pages, padding }: PrintSheetProps) {
  if (typeof document === 'undefined' || pages.length === 0) return null

  return createPortal(
    <div data-print-root>
      {pages.map((page, index) => (
        <div
          key={index}
          data-print-page
          data-page-break={index < pages.length - 1 ? 'after' : undefined}
          style={{
            position: 'relative',
            width: A4_PRINT_WIDTH_PX,
            height: A4_PRINT_HEIGHT_PX,
            overflow: 'hidden',
            background: 'var(--paper)',
          }}
        >
          <div
            data-page
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: PAGE_WIDTH,
              height: PAGE_HEIGHT,
              transform: `scale(${PRINT_SCALE})`,
              transformOrigin: 'top left',
              background: 'var(--paper)',
              color: 'var(--ink)',
            }}
          >
            <SheetPage items={page.items} padding={padding} />
          </div>
        </div>
      ))}
    </div>,
    document.body,
  )
}
