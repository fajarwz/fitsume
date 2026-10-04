import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import ResumeList from '../components/library/ResumeList.jsx'
import TopBar from '../components/layout/TopBar.jsx'
import Button from '../components/ui/Button.jsx'
import Text from '../components/ui/Text.jsx'
import { STARTER_MARKDOWN } from '../lib/starter.js'
import {
  MERGE_MODES,
  downloadText,
  exportLibraryJson,
  exportResumeMarkdown,
  libraryFilename,
  markdownFilename,
  mergeLibraries,
  parseLibraryJson,
  resumeFromMarkdown,
} from '../lib/files.js'
import { useStashContext } from '../state/StashProvider.jsx'

/**
 * The library screen: everything that lives in this browser, and the two ways to
 * get it out of here.
 *
 * storage is per-browser and a user can clear it without meaning to, so the backup
 * file is the real safety net — which is why restore asks whether to merge or
 * replace, and merge is the default.
 */
export default function LibraryPage() {
  const { resumes, activeId, library, actions, status, persistent, saveResult } = useStashContext()
  const navigate = useNavigate()
  const [mode, setMode] = useState(MERGE_MODES.merge)
  const [notice, setNotice] = useState(null)
  const markdownInput = useRef(null)
  const backupInput = useRef(null)

  const open = (id) => navigate(`/resume/${id}`)
  const startBlank = () =>
    open(actions.create({ name: 'My resume', markdown: STARTER_MARKDOWN }).id)

  const importMarkdown = async (event) => {
    const file = event.target.files?.[0]

    event.target.value = ''

    if (!file) return

    const text = await file.text()
    const resume = resumeFromMarkdown(text, { filename: file.name })

    actions.add({
      ...resume,
      name: resume.name === 'Resume' ? file.name.replace(/\.\w+$/, '') : resume.name,
    })
    setNotice({ kind: 'ok', text: `Imported ${file.name} as a new resume.` })
  }

  const importBackup = async (event) => {
    const file = event.target.files?.[0]

    event.target.value = ''

    if (!file) return

    const { library: incoming, status: parseStatus } = parseLibraryJson(await file.text())

    if (!incoming) {
      setNotice({
        kind: 'error',
        text: `That file could not be read as a library backup (${parseStatus}).`,
      })

      return
    }

    const before = library.resumes.length
    const next = mergeLibraries(library, incoming, { mode })

    actions.replace(next)
    setNotice({
      kind: 'ok',
      text:
        mode === MERGE_MODES.replace
          ? `Replaced the library with ${incoming.resumes.length} resume${incoming.resumes.length === 1 ? '' : 's'}.`
          : `Merged: ${next.resumes.length - before} added, ${before} kept.`,
    })
  }

  const backup = () =>
    downloadText({
      filename: libraryFilename(),
      text: exportLibraryJson(library),
      type: 'application/json;charset=utf-8',
    })

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <TopBar
        resume={resumes.find((resume) => resume.id === activeId) ?? null}
        onNew={() => open(actions.create({ name: 'New resume', markdown: STARTER_MARKDOWN }).id)}
        secondary={
          <Button size="sm" variant="secondary" onClick={backup}>
            Back up library
          </Button>
        }
      />

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
        <div>
          <Text as="h1" variant="18-semibold" className="tracking-tight">
            Library
          </Text>
          <Text variant="12-regular" tone="muted" className="mt-1">
            All of this is in your browser. Nothing is uploaded, and there is no account — so a
            backup file is the only copy that survives clearing your browser data.
          </Text>
        </div>

        {!persistent ? (
          <Text
            role="status"
            variant="12-regular"
            className="rounded-md p-2"
            style={{ background: 'rgba(185,28,28,0.12)', color: 'var(--negative)' }}
          >
            This browser is refusing storage, so changes last only for this session. Download a
            backup before you close the tab.
          </Text>
        ) : null}

        {status === 'migrated' ? (
          <Text role="status" variant="12-regular" className="rounded-md bg-[var(--card)] p-2">
            An older saved document was upgraded into the new library format.
          </Text>
        ) : null}

        {status === 'corrupt' ? (
          <Text
            role="status"
            variant="12-regular"
            className="rounded-md p-2"
            style={{ background: 'rgba(185,28,28,0.12)', color: 'var(--negative)' }}
          >
            Saved data could not be read and was skipped rather than deleted. Restore a backup to
            get it back.
          </Text>
        ) : null}

        {saveResult.saved ? null : (
          <Text
            role="status"
            variant="12-regular"
            className="rounded-md p-2"
            style={{ background: 'rgba(185,28,28,0.12)', color: 'var(--negative)' }}
          >
            The last save failed
            {saveResult.reason === 'quota' ? ' because browser storage is full' : ''}. Download a
            backup.
          </Text>
        )}

        {notice ? (
          <Text
            role="status"
            variant="12-regular"
            className="rounded-md p-2"
            style={
              notice.kind === 'error'
                ? { background: 'rgba(185,28,28,0.12)', color: 'var(--negative)' }
                : { background: 'var(--card)' }
            }
          >
            {notice.text}
          </Text>
        ) : null}

        {resumes.length === 0 ? (
          <div className="flex flex-col items-start gap-2 rounded-md border border-dashed border-[var(--border)] p-4">
            <Text variant="12-regular" tone="muted">
              No resumes in this browser. Write one, or bring the sample resumes back from Settings.
            </Text>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="primary" onClick={startBlank}>
                New resume
              </Button>
              <Button size="sm" onClick={() => navigate('/settings')}>
                Restore sample resumes
              </Button>
            </div>
          </div>
        ) : (
          <ResumeList
            resumes={resumes}
            activeId={activeId}
            onOpen={open}
            onRename={actions.rename}
            onDuplicate={actions.duplicate}
            onDelete={actions.remove}
            onExport={(resume) =>
              downloadText({
                filename: markdownFilename(resume.name),
                text: exportResumeMarkdown(resume),
              })
            }
          />
        )}

        <section className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
          <Text as="h2" variant="12-semibold" className="w-full">
            Move work in and out
          </Text>

          <Button size="sm" onClick={() => markdownInput.current?.click()}>
            Import .md
          </Button>
          <input
            ref={markdownInput}
            type="file"
            accept=".md,.markdown,.txt,text/markdown"
            className="hidden"
            onChange={importMarkdown}
          />

          <Button size="sm" onClick={() => backupInput.current?.click()}>
            Restore backup
          </Button>
          <input
            ref={backupInput}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={importBackup}
          />

          <Text
            as="label"
            variant="11-regular"
            tone="muted"
            className="ml-1 flex items-center gap-2"
          >
            <input
              type="checkbox"
              checked={mode === MERGE_MODES.replace}
              onChange={(event) =>
                setMode(event.target.checked ? MERGE_MODES.replace : MERGE_MODES.merge)
              }
              className="h-3.5 w-3.5 accent-[var(--accent)]"
            />
            Replace everything instead of merging
          </Text>
        </section>
      </main>
    </div>
  )
}
