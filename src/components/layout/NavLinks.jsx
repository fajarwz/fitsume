import { NavLink } from 'react-router-dom'

/**
 * The two places the app goes, in one place, because the bar and the drawer both draw them
 * and a route should only be added once.
 *
 * The nav shows where you are rather than being a row of boxes that all look the same: the
 * current page is the only one with a background.
 *
 * `block` lays the same links out as full-width rows for the drawer, where they are a
 * column rather than a line.
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
            [
              'inline-flex h-8 items-center rounded-md text-sm transition',
              block ? 'w-full px-3' : 'px-3',
              isActive
                ? 'bg-[var(--muted)] font-medium text-[var(--foreground)]'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
            ].join(' ')
          }
        >
          {label}
        </NavLink>
      ))}
    </>
  )
}
