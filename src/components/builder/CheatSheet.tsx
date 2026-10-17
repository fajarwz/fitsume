import { useEffect, useRef, useState } from 'react'

import Text from '../ui/Text.tsx'
import { Chevron } from '../ui/icons.tsx'

/* A <details> because it's reference material, one line until opened. The panel floats
   rather than opening inside the column, so a taller sheet cannot take height away from
   the field below it. */
export default function CheatSheet() {
  const [open, setOpen] = useState(false)
  const sheet = useRef<HTMLDivElement | null>(null)

  // It is a layer over the field: anything outside the row and the panel dismisses it.
  useEffect(() => {
    if (!open) return undefined

    const dismissOnOutside = (event: Event) => {
      if (sheet.current && !sheet.current.contains(event.target as Node)) setOpen(false)
    }

    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', dismissOnOutside)
    document.addEventListener('focusin', dismissOnOutside)
    document.addEventListener('keydown', dismissOnEscape)

    return () => {
      document.removeEventListener('mousedown', dismissOnOutside)
      document.removeEventListener('focusin', dismissOnOutside)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [open])

  return (
    <div ref={sheet} className="relative">
      <details
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
        className="group rounded-md border border-[var(--border)] bg-[var(--glass)] backdrop-blur-xl transition-colors open:bg-[var(--muted)]"
      >
        <Text
          as="summary"
          variant="12-medium"
          className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 marker:hidden [&::-webkit-details-marker]:hidden"
        >
          <span>Markdown cheat sheet</span>
          <Chevron className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)] transition-transform group-open:rotate-180" />
        </Text>
      </details>

      {/* A sibling of the <details>, not a child: a blurred element is the blur boundary for
          its contents, so a panel inside the blurred row could only blur the row. */}
      {open ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[min(50vh,20rem)] overflow-y-auto overscroll-contain rounded-md glass-strong px-3 py-2.5">
          <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-2">
            <Text as="dt" variant="12-regular" mono>
              # Name
            </Text>
            <Text as="dd" variant="12-regular" tone="muted">
              Your name, and the title of the document
            </Text>

            <Text as="dt" variant="12-regular" mono>
              City · email · site
            </Text>
            <Text as="dd" variant="12-regular" tone="muted">
              Under your name: the role, then the contact line. Email and web addresses become
              links, in the preview and in the PDF.
            </Text>

            <Text as="dt" variant="12-regular" mono>
              [Label](url)
            </Text>
            <Text as="dd" variant="12-regular" tone="muted">
              A link that shows the label instead of the address. The Link button wraps whatever you
              have selected, or drops in{' '}
              <Text as="span" variant="12-regular" mono>
                [label](example.com)
              </Text>{' '}
              for you
            </Text>

            <Text as="dt" variant="12-regular" mono>
              ## SECTION
            </Text>
            <Text as="dd" variant="12-regular" tone="muted">
              A section heading
            </Text>

            <Text as="dt" variant="12-regular" mono>
              ### Role — Employer
            </Text>
            <Text as="dd" variant="12-regular" tone="muted">
              A job or degree; the line under it is its dates
            </Text>

            <Text as="dt" variant="12-regular" mono>
              - point
            </Text>
            <Text as="dd" variant="12-regular" tone="muted">
              A bullet
            </Text>

            <Text as="dt" variant="12-regular" mono>
              ---
            </Text>
            <Text as="dd" variant="12-regular" tone="muted">
              A rule under the header
            </Text>

            <Text as="dt" variant="12-regular" mono>
              Ctrl+Z
            </Text>
            <Text as="dd" variant="12-regular" tone="muted">
              Undo
            </Text>

            <Text as="dt" variant="12-regular" mono>
              Ctrl+S
            </Text>
            <Text as="dd" variant="12-regular" tone="muted">
              Download .md
            </Text>

            <Text as="dt" variant="12-regular" mono>
              Ctrl+P
            </Text>
            <Text as="dd" variant="12-regular" tone="muted">
              Export PDF
            </Text>

            <Text as="dt" variant="12-regular" mono>
              Tab
            </Text>
            <Text as="dd" variant="12-regular" tone="muted">
              Indent
            </Text>
          </dl>
        </div>
      ) : null}
    </div>
  )
}
