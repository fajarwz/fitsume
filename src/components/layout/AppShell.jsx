/**
 * The app frame: a top bar and whatever the page puts underneath it.
 *
 * The only structural decision here is that the shell scrolls and the page does
 * not, so a long resume cannot make the header wander off.
 */
export default function AppShell({ topBar, children }) {
  return (
    <div className="flex h-full min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      {topBar}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
