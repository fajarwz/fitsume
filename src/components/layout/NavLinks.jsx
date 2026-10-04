import { NavLink, useLocation } from 'react-router-dom'

import { buttonClasses } from '../ui/Button.jsx'

/** Shared by the bar and the drawer so a route is only added once; borrows the Button's ghost classes to match the buttons beside it. */
export const NAV = [
  ['/', 'Resume'],
  ['/settings', 'Settings'],
]

const ACTIVE = '!bg-[var(--accent)] !text-[var(--accent-foreground)]'

export default function NavLinks({ block = false, onNavigate = null }) {
  const { pathname } = useLocation()

  // Resume stays lit on the list and any editor; Settings lights only on itself.
  const isCurrent = (to) =>
    to === '/' ? pathname === '/' || pathname.startsWith('/resume/') : pathname === to

  return (
    <>
      {NAV.map(([to, label]) => (
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
          {label}
        </NavLink>
      ))}
    </>
  )
}