import { useState } from 'react'

import Button from '../ui/Button.jsx'
import { CloseIcon, MoreIcon } from '../ui/icons.jsx'

/* Preview actions floating over the sheet (PDF-viewer style). Export is always visible,
   the rest live behind the dots; menu labels are text, not icons, because tooltips do
   not exist on touch screens. "New" stays in the top bar, not here. */
export default function SheetActions({
  onExport,
  onZoomIn,
  onZoomOut,
  onFit,
  onFull = null,
  full = false,
  zoom,
  showFull = false,
  onDownloadMarkdown,
}) {
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)
  const atFit = zoom === 1

  // One-shot actions close the box; zoom stays open so a run of taps stays together.
  const item = (label, onClick, opts = {}) => (
    <Button
      size="sm"
      variant="ghost"
      className="w-full justify-start"
      onClick={() => {
        onClick()
        close()
      }}
      {...opts}
    >
      {label}
    </Button>
  )

  const toggleLabel = open ? 'Close actions' : 'More actions'

  return (
    <>
      {/* Click-away sibling at z-10, below the z-20 palette: rendered inside the palette
          it painted over the menu and swallowed every click. */}
      {open ? (
        <button
          aria-hidden="true"
          tabIndex={-1}
          onClick={close}
          className="fixed inset-0 z-10 cursor-default"
        />
      ) : null}

      <div data-no-print className="absolute right-5 top-4 z-20 flex items-center gap-1.5">
        {/* Exit is the point of full screen, so it gets primary and Export steps down;
            Escape also exits (wired in the builder). */}
        {full ? (
          <Button size="sm" variant="primary" onClick={onFull} title="Exit full screen (Esc)" className="shadow-md">
            Exit full
          </Button>
        ) : null}
        <Button
          size="sm"
          variant={full ? 'secondary' : 'primary'}
          onClick={onExport}
          className="shadow-md"
        >
          Export PDF
        </Button>

        <div className="relative">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-label={toggleLabel}
            title={toggleLabel}
            className="border border-[var(--border)] bg-[var(--card)] shadow-md"
          >
            {open ? <CloseIcon className="h-4 w-4" /> : <MoreIcon className="h-4 w-4" />}
          </Button>

          {open ? (
            <div
              className="absolute right-0 top-full mt-1.5 flex min-w-[11rem] flex-col gap-0.5 rounded-md border border-[var(--border)] bg-[var(--card)] p-1 shadow-lg"
              data-no-print
              role="menu"
            >
              {/* One cluster: -/+ are self-explanatory, the middle reads and snaps zoom,
                  and all of them keep the menu open. */}
              <div className="flex items-center gap-1 py-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onZoomOut}
                  aria-label="Zoom out"
                  title="Zoom out"
                  className="h-8 w-8 shrink-0 p-0 text-base"
                >
                  −
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onFit}
                  disabled={atFit}
                  title="Fit the whole page to the pane"
                  className="h-8 flex-1 justify-center px-1 tabular-nums"
                >
                  {atFit ? 'Fit' : `${Math.round(zoom * 100)}%`}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onZoomIn}
                  aria-label="Zoom in"
                  title="Zoom in"
                  className="h-8 w-8 shrink-0 p-0 text-base"
                >
                  +
                </Button>
              </div>

              {showFull
                ? item(full ? 'Exit full' : 'Full screen', onFull, {
                    'aria-pressed': full,
                  })
                : null}
              {item('Download .md', onDownloadMarkdown, { title: 'Download .md (Ctrl+S)' })}
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
