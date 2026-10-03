import { Link } from 'react-router-dom'

import Button from '../ui/Button.jsx'
import { useStashContext } from '../../state/StashProvider.jsx'
import { useTheme } from '../../state/ThemeProvider.jsx'

const THEME_LABEL = { light: 'Light', dark: 'Dark', system: 'System' }
const NEXT_THEME = { light: 'dark', dark: 'system', system: 'light' }

/**
 * The bar across the top: which resume is open, and the handful of actions that
 * apply to it. Everything else is in the panels below, so this stays one line.
 */
export default function TopBar({ resume, onChangeResume, onNew, onExport, secondary = null }) {
  const { resumes, persistent } = useStashContext()
  const { theme, setTheme } = useTheme()

  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--card)] px-3 py-2">
      <Link to="/" className="mr-1 text-sm font-semibold tracking-tight">
        fittyresume
      </Link>

      <label className="sr-only" htmlFor="resume-switcher">
        Current resume
      </label>
      <select
        id="resume-switcher"
        value={resume?.id ?? ''}
        onChange={(event) => onChangeResume(event.target.value)}
        className="h-8 max-w-[14rem] rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-xs"
      >
        {resumes.length === 0 ? <option value="">No resumes</option> : null}
        {resumes.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.name}
          </option>
        ))}
      </select>

      {onNew ? (
        <Button size="sm" onClick={onNew}>
          New
        </Button>
      ) : null}

      <Link
        to="/library"
        className="inline-flex h-7 items-center rounded-md border border-[var(--border)] px-2 text-xs font-medium"
      >
        Library
      </Link>

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
