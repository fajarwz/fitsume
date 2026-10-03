import { Link, NavLink, useNavigate } from 'react-router-dom'

import Button from '../ui/Button.jsx'
import { useStashContext } from '../../state/StashProvider.jsx'

const NAV = [
  ['/', 'Library', true],
  ['/settings', 'Settings', false],
]

/**
 * The bar across the top: where you are, which resume is open, and the handful of
 * actions that apply to it. Everything else is in the panels below, so this stays
 * one line.
 *
 * It navigates on its own: the switcher is a link to another resume rather than a
 * piece of hidden app state, so pages do not each have to wire the same handler.
 *
 * The nav shows where you are rather than being a row of boxes that all look the
 * same: the current page is the only one with a background.
 */
export default function TopBar({ resume = null, onNew, onExport, secondary = null }) {
  const { resumes, persistent } = useStashContext()
  const navigate = useNavigate()

  return (
    <header className="flex min-h-16 flex-wrap items-center gap-3 border-b border-[var(--border)] bg-[var(--card)] px-4 py-2">
      <Link to="/" className="mr-2 text-sm font-semibold tracking-tight">
        fittyresume
      </Link>

      <nav className="flex items-center gap-1">
        {NAV.map(([to, label, end]) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'inline-flex h-8 items-center rounded-md px-3 text-sm transition',
                isActive
                  ? 'bg-[var(--muted)] font-medium text-[var(--foreground)]'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
              ].join(' ')
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {resume || resumes.length > 0 ? (
        <>
          <label className="sr-only" htmlFor="resume-switcher">
            Current resume
          </label>
          <select
            id="resume-switcher"
            value={resume?.id ?? ''}
            onChange={(event) => navigate(`/resume/${event.target.value}`)}
            className="h-8 max-w-[14rem] rounded-md border border-[var(--border)] bg-[var(--card)] px-2 text-xs"
          >
            <option value="">No resume open</option>
            {resumes.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </>
      ) : null}

      {onNew ? (
        <Button size="sm" onClick={onNew}>
          New
        </Button>
      ) : null}

      <div className="ml-auto flex items-center gap-2">
        {secondary}
        {onExport ? (
          <Button size="sm" variant="primary" onClick={onExport} disabled={!resume}>
            Export PDF
          </Button>
        ) : null}
      </div>

      {persistent ? null : (
        <p className="w-full text-[11px] text-[var(--negative)]">
          This browser is not saving anything. Changes last for this session only — download a
          backup from the library.
        </p>
      )}
    </header>
  )
}
