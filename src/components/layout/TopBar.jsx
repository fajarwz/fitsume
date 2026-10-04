import { Link, useNavigate } from 'react-router-dom'

import Button from '../ui/Button.jsx'
import Select from '../ui/Select.jsx'
import Text from '../ui/Text.jsx'
import NavLinks from './NavLinks.jsx'
import NavMenu from './NavMenu.jsx'
import { useMediaQuery } from '../../hooks/useMediaQuery.js'
import { useStashContext } from '../../state/StashProvider.jsx'

/** The bar navigates on its own: the switcher is a link, not hidden app state, so pages don't each wire the same handler. */
const STACKED = '(max-width: 1000px)'

export default function TopBar({ resume = null, onNew, onExport, secondary = null }) {
  const { resumes, persistent } = useStashContext()
  const navigate = useNavigate()
  const stacked = useMediaQuery(STACKED)

  return (
    <header
      data-no-print
      className="flex min-h-16 flex-wrap items-center gap-3 border-b border-[var(--border)] bg-[var(--card)] px-4 py-2"
    >
      <Text as={Link} to="/" variant="14-semibold" className="mr-2 tracking-tight">
        Fitsume
      </Text>

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
              <Select
                id="resume-switcher"
                size="sm"
                className="max-w-[14rem]"
                value={resume?.id ?? ''}
                onChange={(event) => navigate(event.target.value === '' ? '/' : `/resume/${event.target.value}`)}
              >
                {/* Placeholder, not a destination — can't be deselected into a broken /resume/ route. */}
                {!resume ? <option value="">No resume open</option> : null}
                {resumes.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </Select>
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
        <Text variant="11-regular" tone="negative" className="w-full">
          This browser is not saving anything. Changes last for this session only — download a
          backup from your resume list.
        </Text>
      )}
    </header>
  )
}
