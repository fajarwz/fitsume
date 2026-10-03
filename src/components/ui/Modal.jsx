import { useEffect } from 'react'

import Button from './Button.jsx'

/**
 * A plain overlay rather than <dialog>: jsdom cannot open a native modal, so the
 * confirmation path would be untestable, and this has no browser-quirk surface.
 *
 * Closing is explicit — the Cancel button, or Escape — rather than a click on the
 * backdrop, so there is no invisible click target and no keyboard-trap-shaped hole.
 */
export default function Modal({ open, title, description, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCancel?.()
    }

    document.addEventListener('keydown', onKeyDown)

    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-xl"
      >
        <h2 className="text-sm font-semibold">{title}</h2>
        {description ? (
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
            {description}
          </p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
