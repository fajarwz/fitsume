/**
 * The markdown dialect, written down.
 *
 * It is a `<details>` because it is reference material, not a panel: it should be one
 * line until someone needs it, and the native element gives that for free — including
 * keyboard support and find-in-page. What it does *not* give for free is a summary that
 * looks like the rest of the app, so the default triangle is hidden and replaced with a
 * chevron that turns over when the thing opens.
 *
 * The two rows that are easy to miss are the ones that make a resume header come out
 * right: the line after the name is the role, and the line after that is the contact
 * line. So the contact row carries an example rather than a description.
 */
export default function CheatSheet() {
  return (
    <details className="group rounded-md border border-[var(--border)] bg-[var(--muted)] transition-colors open:bg-[var(--card)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-medium marker:hidden [&::-webkit-details-marker]:hidden">
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
      </summary>

      <div className="border-t border-[var(--border)] px-3 py-2.5">
        <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-2 text-xs">
          <dt className="font-mono text-[var(--foreground)]"># Name</dt>
          <dd className="text-[var(--muted-foreground)]">
            Your name, and the title of the document
          </dd>

          <dt className="font-mono text-[var(--foreground)]">City · email · site</dt>
          <dd className="text-[var(--muted-foreground)]">
            Under your name: the role, then the contact line. Email and web addresses become links,
            in the preview and in the PDF.
          </dd>

          <dt className="font-mono text-[var(--foreground)]">[Label](url)</dt>
          <dd className="text-[var(--muted-foreground)]">
            A link that shows the label instead of the address; the Link button drops in{' '}
            <span className="font-mono">[label](example.com)</span> for you
          </dd>

          <dt className="font-mono text-[var(--foreground)]">## SECTION</dt>
          <dd className="text-[var(--muted-foreground)]">A section heading</dd>

          <dt className="font-mono text-[var(--foreground)]">### Role — Employer</dt>
          <dd className="text-[var(--muted-foreground)]">
            A job or degree; the line under it is its dates
          </dd>

          <dt className="font-mono text-[var(--foreground)]">- point</dt>
          <dd className="text-[var(--muted-foreground)]">A bullet</dd>

          <dt className="font-mono text-[var(--foreground)]">---</dt>
          <dd className="text-[var(--muted-foreground)]">A rule under the header</dd>
        </dl>

        <p className="mt-3 border-t border-[var(--border)] pt-2 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
          Blank lines are ignored, so space things out however you like. Shortcuts:{' '}
          <span className="font-mono">Ctrl+Z</span> undo, <span className="font-mono">Ctrl+S</span>{' '}
          download .md, <span className="font-mono">Ctrl+P</span> export PDF,{' '}
          <span className="font-mono">Tab</span> indent.
        </p>
      </div>
    </details>
  )
}
