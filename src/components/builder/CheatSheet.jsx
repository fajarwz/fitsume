import Text from '../ui/Text.jsx'

/* A <details> because it's reference material, one line until opened. The default
   triangle is hidden and replaced with an app-styled chevron; the contact row carries
   an example because its placement is easy to miss. */
export default function CheatSheet() {
  return (
    <details className="group rounded-md border border-[var(--border)] bg-[var(--glass)] backdrop-blur-xl transition-colors open:bg-[var(--glass)]">
      <Text
        as="summary"
        variant="12-medium"
        className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 marker:hidden [&::-webkit-details-marker]:hidden"
      >
        <span>Markdown cheat sheet</span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)] transition-transform group-open:rotate-180"
        >
          <path
            d="M6 8l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Text>

      <div className="border-t border-[var(--border)] px-3 py-2.5">
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
            Under your name: the role, then the contact line. Email and web addresses become links,
            in the preview and in the PDF.
          </Text>

          <Text as="dt" variant="12-regular" mono>
            [Label](url)
          </Text>
          <Text as="dd" variant="12-regular" tone="muted">
            A link that shows the label instead of the address; the Link button drops in{' '}
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
        </dl>

        <Text
          variant="11-regular"
          tone="muted"
          leading="relaxed"
          className="mt-3 border-t border-[var(--border)] pt-2"
        >
          Blank lines are ignored, so space things out however you like. Shortcuts:{' '}
          <Text as="span" variant="11-regular" mono>
            Ctrl+Z
          </Text>{' '}
          undo,{' '}
          <Text as="span" variant="11-regular" mono>
            Ctrl+S
          </Text>{' '}
          download .md,{' '}
          <Text as="span" variant="11-regular" mono>
            Ctrl+P
          </Text>{' '}
          export PDF,{' '}
          <Text as="span" variant="11-regular" mono>
            Tab
          </Text>{' '}
          indent.
        </Text>
      </div>
    </details>
  )
}
