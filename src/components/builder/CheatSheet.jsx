/**
 * The markdown dialect, written down.
 *
 * Five rules, and the two that are easy to miss are the ones that make a resume
 * header come out right: the line after the name is the role, and the line after
 * that is the faint contact line. So they are spelled out here rather than left to
 * be discovered.
 */
export default function CheatSheet() {
  return (
    <details className="rounded-md border border-[var(--border)] bg-[var(--background)] p-2 text-xs">
      <summary className="cursor-pointer font-medium">Markdown cheat sheet</summary>

      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="font-mono"># Name</dt>
        <dd className="text-[var(--muted-foreground)]">Your name — the one line that sets the title</dd>

        <dt className="font-mono">plain line</dt>
        <dd className="text-[var(--muted-foreground)]">
          Under your name: your role, then your contact line
        </dd>

        <dt className="font-mono">## SECTION</dt>
        <dd className="text-[var(--muted-foreground)]">A section heading</dd>

        <dt className="font-mono">### Role — Employer</dt>
        <dd className="text-[var(--muted-foreground)]">
          A job or degree; the line under it is its dates
        </dd>

        <dt className="font-mono">- point</dt>
        <dd className="text-[var(--muted-foreground)]">A bullet</dd>

        <dt className="font-mono">---</dt>
        <dd className="text-[var(--muted-foreground)]">A rule under the header</dd>
      </dl>

      <p className="mt-2 text-[var(--muted-foreground)]">
        Blank lines are ignored, so space things out however you like. Shortcuts:{' '}
        <span className="font-mono">Ctrl+Z</span> undo, <span className="font-mono">Ctrl+S</span>{' '}
        download .md, <span className="font-mono">Ctrl+P</span> export PDF,{' '}
        <span className="font-mono">Tab</span> indent.
      </p>
    </details>
  )
}
