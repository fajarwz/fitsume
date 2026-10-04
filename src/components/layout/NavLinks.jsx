import { NavLink } from 'react-router-dom'

import { buttonClasses } from '../ui/Button.jsx'

/**
 * The two places the app goes, in one place, because the bar and the drawer both draw them
 * and a route should only be added once.
 *
 * The links borrow the Button's classes rather than copying them: they are ghost buttons
 * that happen to be anchors, and a hand-written copy of those strings is how a nav stops
 * matching the buttons beside it.
 *
 * The nav shows where you are rather than being a row of boxes that all look the same: the
 * current page is the only one with a background.
 *
 * `block` lays the same links out as full-width rows for the drawer, where they are a
 * column rather than a line, at the height of the rest of that column's rows.
 */
export const NAV = [
  ['/', 'Library', true],
  ['/settings', 'Settings', false],
]

export default function NavLinks({ block = false, onNavigate = null }) {
  return (
    <>
      {NAV.map(([to, label, end]) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate ?? undefined}
          className={({ isActive }) =>
            buttonClasses({
              variant: 'ghost',
              size: block ? 'md' : 'sm',
              className: [
                block ? 'w-full justify-start' : '',
                isActive ? 'bg-[var(--muted)] text-[var(--foreground)]' : '',
              ]
                .filter(Boolean)
                .join(' '),
            })
          }
        >
          {label}
        </NavLink>
      ))}
    </>
  )
}
