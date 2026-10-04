import { Link, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

import Button from '../ui/Button.tsx'
import { buttonClasses } from '../ui/Button.tsx'
import Select from '../ui/Select.tsx'
import Text from '../ui/Text.tsx'
import NavLinks from './NavLinks.tsx'
import NavMenu from './NavMenu.tsx'
import { GitHubIcon } from '../ui/icons.tsx'
import { useMediaQuery } from '../../hooks/useMediaQuery.ts'
import { useStashContext } from '../../state/StashProvider.tsx'
import type { Resume } from '../../lib/stash.ts'

/** The bar navigates on its own: the switcher is a link, not hidden app state, so pages don't each wire the same handler. */
const STACKED = '(max-width: 1000px)'

export interface TopBarProps {
  resume?: Resume | null
  onNew?: () => void
  onExport?: () => void
  secondary?: ReactNode
}

export default function TopBar({ resume = null, onNew, onExport, secondary = null }: TopBarProps) {
  const { resumes, persistent } = useStashContext()
  const navigate = useNavigate()
  const stacked = useMediaQuery(STACKED)

  return (
    <header
      data-no-print
      className="relative z-30 flex min-h-16 flex-wrap items-center gap-3 border-b border-[var(--glass-border)] bg-[var(--glass)] px-4 py-2 backdrop-blur-xl"
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
                onChange={(event) =>
                  navigate(event.target.value === '' ? '/' : `/resume/${event.target.value}`)
                }
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
            <a
              href="https://github.com/fajarwz/fitsume"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: 'ghost', size: 'sm' })}
              aria-label="Fitsume on GitHub"
            >
              <GitHubIcon className="h-4 w-4" />
            </a>
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
