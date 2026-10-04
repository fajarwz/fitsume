import type { ReactNode } from 'react'

/** The shell scrolls and the page does not, so a long resume cannot push the header off. */
export interface AppShellProps {
  topBar: ReactNode
  children: ReactNode
}

export default function AppShell({ topBar, children }: AppShellProps) {
  return (
    <div className="flex h-full min-h-screen flex-col text-[var(--foreground)]">
      {topBar}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
