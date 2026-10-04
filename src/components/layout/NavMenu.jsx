import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '../ui/Button.jsx'
import Select from '../ui/Select.jsx'
import Text from '../ui/Text.jsx'
import { CloseIcon, MenuIcon } from '../ui/icons.jsx'
import NavLinks from './NavLinks.jsx'

/**
 * Everything the bar holds, behind a hamburger, for a narrow screen.
 *
 * At a phone width the bar wraps and eats the height the page needs, so below the stacked
 * breakpoint the nav, the resume switcher and every action move into a panel that slides in
 * from the right. It is the same set of controls rather than a reduced one: what changes is
 * where they live, plus the fact that the panel can be dismissed by tapping the page behind
 * it or pressing Escape.
 *
 * The panel stays mounted and is parked off-screen instead of being added and removed, so
 * opening it is a transition rather than a first paint. `inert` is what keeps the copy
 * sitting outside the viewport out of the tab order and away from a screen reader.
 *
 * Marked `data-no-print` — along with the scrim — because it is furniture, and because a
 * drawer that happened to be open when you pressed Export must not print onto the resume.
 */
const PANEL =
  'fixed inset-y-0 right-0 z-40 flex w-72 max-w-[85vw] flex-col gap-3 overflow-y-auto border-l border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow)] outline-none transition-transform duration-200 ease-out'

export default function NavMenu({
  resumes = [],
  resume = null,
  onNew,
  onExport,
  secondary = null,
}) {
  const [open, setOpen] = useState(false)
  const trigger = useRef(null)
  const panel = useRef(null)
  const navigate = useNavigate()

  const close = () => {
    setOpen(false)
    trigger.current?.focus()
  }

  // Escape closes it, and the page behind does not scroll while it is over the page.
  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') close()
    }

    const previous = document.body.style.overflow

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    panel.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [open])

  const switchResume = (event) => {
    const id = event.target.value

    if (id === '') return

    navigate(`/resume/${id}`)
    close()
  }

  return (
    <>
      <Button
        ref={trigger}
        size="sm"
        variant="ghost"
        className="ml-auto"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="topbar-menu"
        onClick={() => (open ? close() : setOpen(true))}
      >
        <MenuIcon className="h-4 w-4" />
      </Button>

      <div
        data-no-print
        aria-hidden="true"
        onClick={close}
        className={[
          'fixed inset-0 z-30 bg-[rgba(0,0,0,0.25)] transition-opacity duration-200',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
      />

      <div
        ref={panel}
        id="topbar-menu"
        data-no-print
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        tabIndex={-1}
        inert={!open}
        className={[PANEL, open ? 'translate-x-0' : 'pointer-events-none translate-x-full'].join(
          ' ',
        )}
      >
        <div className="flex items-center justify-between">
          <Text as="span" variant="14-semibold" className="tracking-tight">
            Menu
          </Text>
          <Button size="sm" variant="ghost" aria-label="Close menu" onClick={close}>
            <CloseIcon className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex flex-col gap-1">
          <NavLinks block onNavigate={close} />
        </nav>

        {resume || resumes.length > 0 ? (
          <>
            <label className="sr-only" htmlFor="menu-resume-switcher">
              Current resume
            </label>
            <Select
              id="menu-resume-switcher"
              size="md"
              className="w-full"
              value={resume?.id ?? ''}
              onChange={switchResume}
            >
              <option value="">No resume open</option>
              {resumes.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </Select>
          </>
        ) : null}

        {onNew ? (
          <Button
            className="w-full"
            onClick={() => {
              onNew()
              close()
            }}
          >
            New resume
          </Button>
        ) : null}

        {secondary ? (
          /* Whatever the page passes is rendered at the drawer's row size, so a page cannot
             make the column inconsistent by handing over a small button. */
          <div className="flex flex-col [&_button]:h-10 [&_button]:w-full" onClickCapture={close}>
            {secondary}
          </div>
        ) : null}

        {onExport ? (
          <Button
            variant="primary"
            disabled={!resume}
            className="mt-auto w-full"
            onClick={() => {
              close()
              onExport()
            }}
          >
            Export PDF
          </Button>
        ) : null}
      </div>
    </>
  )
}
