import { useEffect, useState } from 'react'

import Button from '../ui/Button.tsx'
import Modal from '../ui/Modal.tsx'
import Text from '../ui/Text.tsx'
import { CloseIcon, MoreIcon } from '../ui/icons.tsx'
import { isSampleResume } from '../../lib/samples.ts'
import type { Resume } from '../../lib/stash.ts'

/** One visible control per row (Open); the rest hide behind More. Delete asks first — there is no server copy, only a user-downloaded backup. */
export interface ResumeListProps {
  resumes: Resume[]
  activeId: string | null
  selected: Set<string>
  onOpen: (id: string) => void
  onRename: (id: string, name: string) => void
  onDuplicate: (id: string) => void
  onExport: (resume: Resume) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
}

export default function ResumeList({
  resumes,
  activeId,
  selected,
  onOpen,
  onRename,
  onDuplicate,
  onExport,
  onDelete,
  onToggle,
}: ResumeListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Resume | null>(null)

  const closeMenu = () => setOpenMenuId(null)

  useEffect(() => {
    if (openMenuId === null) return undefined

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }

    document.addEventListener('keydown', onKeyDown)

    return () => document.removeEventListener('keydown', onKeyDown)
  }, [openMenuId])

  if (resumes.length === 0) {
    return (
      <Text
        variant="12-regular"
        tone="muted"
        className="rounded-md border border-dashed border-[var(--border)] p-4"
      >
        Nothing here yet.
      </Text>
    )
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {resumes.map((resume) => {
          const isActive = resume.id === activeId
          const isChecked = selected.has(resume.id)
          const menuOpen = openMenuId === resume.id

          return (
            <li
              key={resume.id}
              aria-current={isActive ? 'true' : undefined}
              className={`relative flex flex-wrap items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--glass)] p-3 backdrop-blur-xl ${
                isActive ? 'border-l-2 border-l-[var(--accent)]' : ''
              } ${menuOpen ? 'z-20' : ''}`}
            >
              <input
                type="checkbox"
                aria-label={`Select ${resume.name}`}
                checked={isChecked}
                onChange={() => onToggle(resume.id)}
                className="h-4 w-4 accent-[var(--accent)]"
              />

              <label className="sr-only" htmlFor={`name-${resume.id}`}>
                Resume name
              </label>
              <input
                id={`name-${resume.id}`}
                value={resume.name}
                onChange={(event) => onRename(resume.id, event.target.value)}
                className="h-8 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 text-sm font-medium hover:border-[var(--border)] focus:border-[var(--border)] md:min-w-[10rem]"
              />

              {isSampleResume(resume) ? (
                <Text
                  as="span"
                  variant="11-regular"
                  tone="muted"
                  className="rounded-full border border-[var(--border)] px-1.5 py-0.5"
                  title="One of the seeded sample resumes. Delete it like any other."
                >
                  sample
                </Text>
              ) : null}

              <Text as="span" variant="11-regular" tone="muted">
                {resume.updatedAt?.slice(0, 10) ?? ''}
              </Text>

              <Button size="sm" onClick={() => onOpen(resume.id)} aria-label={`Open ${resume.name}`}>
                Open
              </Button>

              <Button
                size="sm"
                variant="ghost"
                aria-label={`Actions for ${resume.name}`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => (menuOpen ? closeMenu() : setOpenMenuId(resume.id))}
                className="border border-[var(--border)] bg-[var(--card)]"
              >
                {menuOpen ? <CloseIcon className="h-4 w-4" /> : <MoreIcon className="h-4 w-4" />}
              </Button>

              {menuOpen ? (
                <>
                  <div className="fixed inset-0 z-10" onClick={closeMenu} aria-hidden="true" />
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-20 mt-1 flex min-w-[9rem] flex-col gap-0.5 rounded-md glass-strong p-1"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        closeMenu()
                        onDuplicate(resume.id)
                      }}
                      className="flex items-center justify-start gap-2 rounded px-2 py-1.5 text-left text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        closeMenu()
                        onExport(resume)
                      }}
                      className="flex items-center justify-start gap-2 rounded px-2 py-1.5 text-left text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
                    >
                      Export .md
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        closeMenu()
                        setPendingDelete(resume)
                      }}
                      className="flex items-center justify-start gap-2 rounded px-2 py-1.5 text-left text-xs font-medium text-[var(--negative)] hover:bg-[var(--muted)]"
                    >
                      Delete
                    </button>
                  </div>
                </>
              ) : null}
            </li>
          )
        })}
      </ul>

      <Modal
        open={pendingDelete !== null}
        title={`Delete "${pendingDelete?.name ?? ''}"?`}
        description="This is irreversible."
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete.id)

          setPendingDelete(null)
        }}
      />
    </>
  )
}
