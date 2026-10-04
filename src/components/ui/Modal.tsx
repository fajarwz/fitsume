import { useEffect } from 'react'

import Button from './Button.tsx'
import Text from './Text.tsx'

/**
 * Plain overlay rather than <dialog> (jsdom can't open one); Escape/Cancel only, no backdrop click.
 */
export interface ModalProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  onConfirm?: () => void
  onCancel?: () => void
}

export default function Modal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: ModalProps) {
  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined

    const onKeyDown = (event: KeyboardEvent) => {
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
        className="w-full max-w-sm rounded-lg glass p-5"
      >
        <Text as="h2" variant="14-semibold">
          {title}
        </Text>
        {description ? (
          <Text variant="12-regular" tone="muted" leading="relaxed" className="mt-2">
            {description}
          </Text>
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
