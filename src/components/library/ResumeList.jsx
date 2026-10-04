import { useState } from 'react'

import Button from '../ui/Button.jsx'
import Modal from '../ui/Modal.jsx'
import Text from '../ui/Text.jsx'
import { isSampleResume } from '../../lib/samples.js'

/**
 * The library list: rename, open, copy, take away, delete.
 *
 * Every row has the same controls, and Open is always a real button. Which resume was
 * last open is shown by the row itself — a marker down its left edge — rather than by
 * turning that row's Open button into text, because a control that looks clickable and
 * is not is worse than no control at all.
 *
 * Deleting asks first, and says what is being deleted, because there is no server
 * copy to restore from — the only backup is a file the user downloaded themselves.
 */
export default function ResumeList({
  resumes,
  activeId,
  onOpen,
  onRename,
  onDuplicate,
  onExport,
  onDelete,
}) {
  const [pendingDelete, setPendingDelete] = useState(null)

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

          return (
            <li
              key={resume.id}
              aria-current={isActive ? 'true' : undefined}
              className={`flex flex-wrap items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] p-3 ${
                isActive ? 'border-l-2 border-l-[var(--accent)]' : ''
              }`}
            >
              <label className="sr-only" htmlFor={`name-${resume.id}`}>
                Resume name
              </label>
              <input
                id={`name-${resume.id}`}
                value={resume.name}
                onChange={(event) => onRename(resume.id, event.target.value)}
                className="h-8 min-w-[10rem] flex-1 rounded-md border border-transparent bg-transparent px-2 text-sm font-medium hover:border-[var(--border)] focus:border-[var(--border)]"
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

              <Button
                size="sm"
                onClick={() => onOpen(resume.id)}
                aria-label={`Open ${resume.name}`}
              >
                Open
              </Button>

              <Button size="sm" variant="ghost" onClick={() => onDuplicate(resume.id)}>
                Duplicate
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onExport(resume)}>
                .md
              </Button>
              <Button size="sm" variant="danger" onClick={() => setPendingDelete(resume)}>
                Delete
              </Button>
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
