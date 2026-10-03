import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import FitPanel from '../components/builder/FitPanel.jsx'
import MarkdownEditor from '../components/builder/MarkdownEditor.jsx'
import ResumeSheet from '../components/builder/ResumeSheet.jsx'
import TopBar from '../components/layout/TopBar.jsx'
import Button from '../components/ui/Button.jsx'
import { useDebouncedValue } from '../hooks/useDebouncedValue.js'
import { useFit } from '../hooks/useFit.js'
import { useMediaQuery } from '../hooks/useMediaQuery.js'
import { downloadText, exportResumeMarkdown, markdownFilename } from '../lib/files.js'
import { exportToPdf } from '../lib/pdf.js'
import { DEFAULT_RESUME_SETTINGS } from '../lib/settings.js'
import { useStashContext } from '../state/StashProvider.jsx'

/**
 * The builder: write on the left, see the page on the right, adjust the fit
 * underneath the writing.
 *
 * The fit runs against a debounced copy of the markdown, so typing stays
 * immediate while the measurement catches up a moment later. Which resume is open
 * and what its settings are both come from the library, so there is no second copy
 * of the document to keep in step.
 */
const TABS = [
  ['write', 'Write'],
  ['preview', 'Preview'],
  ['settings', 'Fit'],
]

/**
 * Zoom multiplies the fit-to-pane scale, so 1 always means "all of it, no
 * scrolling" whatever the window is doing. Session state on purpose: a saved zoom
 * would be a stale zoom the next time you open the app at a different size.
 */
const ZOOM_MIN = 0.5
const ZOOM_MAX = 3
const ZOOM_STEP = 0.25

const clampZoom = (value) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100))

export default function BuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { resumes, actions, saveResult } = useStashContext()
  const [tab, setTab] = useState('write')
  const [zoom, setZoom] = useState(1)
  const sheet = useRef(null)
  const stacked = useMediaQuery('(max-width: 1000px)')

  // The address is the source of truth for which resume is open, and the library's
  // own active id follows it, so the switcher and the URL cannot disagree.
  const resume = resumes.find((entry) => entry.id === id) ?? null
  const activeId = resume?.id ?? null

  useEffect(() => {
    if (activeId) actions.select(activeId)
  }, [activeId, actions])

  const markdown = resume?.markdown ?? ''
  const settings = resume?.settings ?? DEFAULT_RESUME_SETTINGS
  const settled = useDebouncedValue(markdown, 160)
  const fit = useFit(settled, settings)

  // A link to a resume this browser does not have goes home, rather than showing an
  // editor for a document that does not exist.
  if (!resume) return <Navigate to="/" replace />

  const update = (patch) => actions.update(resume.id, patch)

  const exportPdf = () => exportToPdf({ page: sheet.current, markdown })

  const downloadMarkdown = () =>
    downloadText({ filename: markdownFilename(resume.name), text: exportResumeMarkdown(resume) })

  const editor = (
    <MarkdownEditor
      markdown={markdown}
      resumeId={resume.id}
      onChange={(next) => update({ markdown: next })}
      onExport={exportPdf}
      onDownloadMarkdown={downloadMarkdown}
    />
  )

  const preview = (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div
        data-no-print
        className="flex w-full items-center justify-end gap-1 pb-2 text-[11px] text-[var(--muted-foreground)]"
      >
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setZoom((current) => clampZoom(current - ZOOM_STEP))}
          disabled={zoom <= ZOOM_MIN}
          aria-label="Zoom out"
          title="Zoom out"
        >
          −
        </Button>
        <span className="min-w-[3.5rem] text-center font-mono tabular-nums">
          {zoom === 1 ? 'Fit' : `${Math.round(zoom * 100)}%`}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setZoom((current) => clampZoom(current + ZOOM_STEP))}
          disabled={zoom >= ZOOM_MAX}
          aria-label="Zoom in"
          title="Zoom in"
        >
          +
        </Button>
        {zoom === 1 ? null : (
          <Button size="sm" onClick={() => setZoom(1)} title="Fit the whole page to the pane">
            Fit
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1">
        <ResumeSheet
          positioned={fit.positioned}
          padding={settings.padding}
          overflow={fit.overflow}
          sheetRef={sheet}
          zoom={zoom}
        />
      </div>
    </div>
  )

  const controls = (
    <FitPanel
      settings={settings}
      fit={fit}
      onChange={(patch) =>
        update({
          settings: { ...settings, ...patch, spacing: { ...settings.spacing, ...patch.spacing } },
        })
      }
    />
  )

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <TopBar
        resume={resume}
        onNew={() => navigate(`/resume/${actions.create({ name: 'New resume' }).id}`)}
        onExport={exportPdf}
        secondary={
          <Button
            size="sm"
            variant="ghost"
            onClick={downloadMarkdown}
            title="Download .md (Ctrl+S)"
          >
            .md
          </Button>
        }
      />

      {stacked ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
          <div className="flex gap-1" role="tablist" aria-label="Editor, preview or fit">
            {TABS.map(([id, label]) => (
              <Button
                key={id}
                role="tab"
                size="sm"
                aria-selected={tab === id}
                variant={tab === id ? 'primary' : 'ghost'}
                onClick={() => setTab(id)}
              >
                {label}
              </Button>
            ))}
          </div>
          <section className="flex min-h-0 flex-1 flex-col rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
            <div className={tab === 'write' ? 'contents' : 'hidden'}>{editor}</div>
            <div className={tab === 'preview' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
              {preview}
            </div>
            <div className={tab === 'settings' ? 'contents' : 'hidden'}>{controls}</div>
          </section>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(20rem,1fr)_minmax(26rem,1.05fr)] gap-3 p-3">
          <div className="flex min-h-0 flex-col gap-3">
            <section className="flex min-h-0 flex-[1.4] flex-col rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
              {editor}
            </section>
            <section className="max-h-[42%] shrink-0 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
              {controls}
            </section>
          </div>
          <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
            {preview}
          </section>
        </div>
      )}

      <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 pb-2 text-[11px] text-[var(--muted-foreground)]">
        <span>
          {resumes.length} resume{resumes.length === 1 ? '' : 's'} · stored in this browser
        </span>
        {saveResult.saved ? null : (
          <span className="text-[var(--negative)]">
            Not saved: {saveResult.reason === 'quota' ? 'browser storage is full' : 'storage refused'}
          </span>
        )}
      </footer>
    </div>
  )
}
