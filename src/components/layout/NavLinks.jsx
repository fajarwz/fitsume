import { NavLink, useLocation } from 'react-router-dom'

import { buttonClasses } from '../ui/Button.jsx'

/**
 * The two places the app goes, in one place, because the bar and the drawer both draw them
 * and a route should only be added once.
 *
 * The links borrow the Button's classes rather than copying them: they are ghost buttons
 * that happen to be anchors, and a hand-written copy of those strings is how a nav stops
 * matching the buttons beside it.
 *
 * The nav shows where you are by filling the current page's link with the accent — a
 * filled pill that reads as "here", unlike the muted hover wash that would otherwise be
 * indistinguishable from it. The `!-overrides` keep the pill from collapsing back into the
 * ghost variant's own hover look.
 *
 * `block` lays the same links out as full-width rows for the drawer, where they are a
 * column rather than a line, at the height of the rest of that column's rows.
 */
export const NAV = [
  ['/', 'Resume'],
  ['/settings', 'Settings'],
]

/** A filled pill in the accent: white on light, black on dark. */
const ACTIVE = '!bg-[var(--accent)] !text-[var(--accent-foreground)]'

export default function NavLinks({ block = false, onNavigate = null }) {
  const { pathname } = useLocation()

  // Editing a resume is part of the Resume area, so the Resume link stays lit on both the
  // list and any editor, while Settings lights only on itself.
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