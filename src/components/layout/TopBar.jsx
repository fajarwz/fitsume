import { Link, useNavigate } from 'react-router-dom'

import Button from '../ui/Button.jsx'
import { useStashContext } from '../../state/StashProvider.jsx'
import { useTheme } from '../../state/ThemeProvider.jsx'

const THEME_LABEL = { light: 'Light', dark: 'Dark', system: 'System' }
const NEXT_THEME = { light: 'dark', dark: 'system', system: 'light' }

const NAV = [
  ['/', 'Library'],
  ['/samples', 'Samples'],
]

/**
 * The bar across the top: where you are, which resume is open, and the handful of
 * actions that apply to it. Everything else is in the panels below, so this stays
 * one line.
 *
 * It navigates on its own: the switcher is a link to another resume rather than a
 * piece of hidden app state, so pages do not each have to wire the same handler.
 */
export default function TopBar({ resume = null, onNew, onExport, secondary = null }) {
  const { resumes, persistent } = useStashContext()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--card)] px-3 py-2">
      <Link to="/" className="mr-1 text-sm font-semibold tracking-tight">
        fittyresume
      </Link>

      <nav className="flex items-center gap-1">
        {NAV.map(([to, label]) => (
          <Link
            key={to}
            to={to}
            className="inline-flex h-7 items-center rounded-md border border-[var(--border)] px-2 text-xs font-medium"
          >
            {label}
          </Link>
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
            className="h-8 max-w-[14rem] rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-xs"
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
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setTheme(NEXT_THEME[theme] ?? 'system')}
          aria-label={`Theme: ${THEME_LABEL[theme] ?? theme}. Switch theme.`}
          title={`Theme: ${THEME_LABEL[theme] ?? theme}`}
        >
          {THEME_LABEL[theme] ?? theme}
        </Button>
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
