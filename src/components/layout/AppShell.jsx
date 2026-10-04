/** The shell scrolls and the page does not, so a long resume cannot push the header off. */
export default function AppShell({ topBar, children }) {
  return (
    <div className="flex h-full min-h-screen flex-col text-[var(--foreground)]">
      {topBar}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
