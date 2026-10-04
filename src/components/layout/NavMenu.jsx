import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '../ui/Button.jsx'
import Select from '../ui/Select.jsx'
import Text from '../ui/Text.jsx'
import { CloseIcon, MenuIcon } from '../ui/icons.jsx'
import NavLinks from './NavLinks.jsx'

/** Narrow-screen drawer: same controls as the bar, kept mounted and parked off-screen so it slides rather than repaints. */
const PANEL =
  'fixed inset-y-0 right-0 z-40 flex w-72 max-w-[85vw] flex-col gap-3 overflow-y-auto border-l border-[var(--glass-border)] bg-[var(--glass)] p-4 shadow-[var(--shadow)] backdrop-blur-xl outline-none transition-transform duration-200 ease-out'

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

    // "No resume open" means the library, not /resume/ — an empty param matches nothing and 404s.
    navigate(id === '' ? '/' : `/resume/${id}`)
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
              {/* Placeholder, not a pickable destination — can't be unselected into a broken /resume/ route. */}
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
          // Constrain secondary controls to the drawer's row size.
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
