import { Link, useNavigate } from 'react-router-dom'

import Button from '../ui/Button.jsx'
import NavLinks from './NavLinks.jsx'
import NavMenu from './NavMenu.jsx'
import { useMediaQuery } from '../../hooks/useMediaQuery.js'
import { useStashContext } from '../../state/StashProvider.jsx'

/**
 * The bar across the top: where you are, which resume is open, and the handful of
 * actions that apply to it. Everything else is in the panels below, so this stays
 * one line.
 *
 * It navigates on its own: the switcher is a link to another resume rather than a
 * piece of hidden app state, so pages do not each have to wire the same handler.
 *
 * On a narrow screen the same contents go behind a hamburger and slide in from the right
 * (NavMenu). At a phone width a bar of buttons wraps onto three lines and takes the height
 * the preview needs, which is the one thing this layout cannot spare.
 */
const STACKED = '(max-width: 1000px)'

export default function TopBar({ resume = null, onNew, onExport, secondary = null }) {
  const { resumes, persistent } = useStashContext()
  const navigate = useNavigate()
  const stacked = useMediaQuery(STACKED)

  return (
    <header className="flex min-h-16 flex-wrap items-center gap-3 border-b border-[var(--border)] bg-[var(--card)] px-4 py-2">
      <Link to="/" className="mr-2 text-sm font-semibold tracking-tight">
        fittyresume
      </Link>

      {stacked ? (
        <NavMenu
          resumes={resumes}
          resume={resume}
          onNew={onNew}
          onExport={onExport}
          secondary={secondary}
        />
      ) : (
        <>
          <nav className="flex items-center gap-1">
            <NavLinks />
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
                /* pr-9 rather than px-2: the chevron is drawn by the forms plugin as a
                   background image 0.5rem from the right edge, and it reserves 2.5rem of
                   padding for its own space. Overriding that padding with a symmetric one
                   puts a long resume name straight through the arrow. */
                className="h-8 max-w-[14rem] truncate rounded-md border border-[var(--border)] bg-[var(--card)] pl-2 pr-9 text-xs"
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
        </>
      )}

      {persistent ? null : (
        <p className="w-full text-[11px] text-[var(--negative)]">
          This browser is not saving anything. Changes last for this session only — download a
          backup from the library.
        </p>
      )}
    </header>
  )
}
