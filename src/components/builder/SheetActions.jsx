import { useState } from 'react'

import Button from '../ui/Button.jsx'
import { CloseIcon, MoreIcon } from '../ui/icons.jsx'

/**
 * The actions that apply to the page you are looking at, collected as one floating
 * control over the preview instead of spread between a rail on the edge and the top
 * bar.
 *
 * Export is always visible because it is the one you go to the preview for. The rest
 * live behind the dots: zoom, full screen, and a copy of the markdown. They are the
 * PDF-viewer pattern — controls float on the sheet rather than stealing its height —
 * and it is why this pane can give the whole window to the page.
 *
 * The menu is text, not icons, on purpose: a tooltip does not exist on a touch screen,
 * so an icon-only list would make mobile users guess what each button does — and a
 * dropdown has no reason to trade that away, since a vertical list costs the same
 * whether the labels are words or pictures. The only exceptions are the − and +
 * zoom buttons, which are a convention self-explanatory without a label.
 *
 * "New" is deliberately not here. It is not about the page on screen; it starts a
 * different resume, so it stays in the top bar where creation belongs.
 */
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

  // One-shot actions close the box when they run. Zoom is the exception: it is
  // incremental, and several taps in a row are the usual way it is used, so the menu
  // stays open until the toggle or a click outside lets it go.
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
      {/* A tap anywhere else closes the dots box. A sibling at z-10, behind the palette
          at z-20: with it rendered *inside* the palette its fixed full-screen box painted
          over the menu and swallowed every click, so nothing in the dots worked. */}
      {open ? (
        <button
          aria-hidden="true"
          tabIndex={-1}
          onClick={close}
          className="fixed inset-0 z-10 cursor-default"
        />
      ) : null}

      <div data-no-print className="absolute right-3 top-3 z-20 flex items-center gap-1.5">
        {/* Full screen wants an obvious way out, not a control hidden in the dots: the
            exit is the whole point of that mode, so it gets the primary colour and Export
            steps down to secondary until the page is on its own again. Escape exits too
            (wired in the builder). */}
        {full ? (
          <Button size="sm" variant="primary" onClick={onFull} title="Exit full screen (Esc)">
            Exit full
          </Button>
        ) : null}
        <Button size="sm" variant={full ? 'secondary' : 'primary'} onClick={onExport}>
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
            className="border border-[var(--border)] bg-[var(--card)]"
          >
            {open ? <CloseIcon className="h-4 w-4" /> : <MoreIcon className="h-4 w-4" />}
          </Button>

          {open ? (
            <div
              className="absolute right-0 top-full mt-1.5 flex min-w-[11rem] flex-col gap-0.5 rounded-md border border-[var(--border)] bg-[var(--card)] p-1 shadow-lg"
              data-no-print
              role="menu"
            >
              {/* One zoom cluster instead of a stack of rows: − and + are understood
                  without a tooltip, and the middle button both reads the zoom and snaps
                  it back to fit. Every control here keeps the menu open, so a run of
                  zoom taps stays together. */}
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
