import { NavLink, useLocation } from 'react-router-dom'
import type { ComponentType } from 'react'

import { buttonClasses } from '../ui/Button.tsx'
import { DocumentIcon, SlidersIcon } from '../ui/icons.tsx'

/** Shared by the bar and the drawer so a route is only added once; borrows the Button's ghost classes to match the buttons beside it. */
export const NAV: ReadonlyArray<
  readonly [string, string, ComponentType<{ className?: string }>]
> = [
  ['/', 'Resume', DocumentIcon],
  ['/settings', 'Settings', SlidersIcon],
]

const ACTIVE = '!bg-[var(--accent)] !text-[var(--accent-foreground)]'

export interface NavLinksProps {
  block?: boolean
  onNavigate?: (() => void) | null
}

export default function NavLinks({ block = false, onNavigate = null }: NavLinksProps) {
  const { pathname } = useLocation()

  // Resume stays lit on the list and any editor; Settings lights only on itself.
  const isCurrent = (to: string) =>
    to === '/' ? pathname === '/' || pathname.startsWith('/resume/') : pathname === to

  return (
    <>
      {NAV.map(([to, label, Icon]) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate ?? undefined}
          className={buttonClasses({
            variant: 'ghost',
            size: block ? 'md' : 'sm',
            className: [
              block ? 'w-full justify-start' : '',
              isCurrent(to) ? ACTIVE : '',
            ]
              .filter(Boolean)
              .join(' '),
          })}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </>
  )
}
