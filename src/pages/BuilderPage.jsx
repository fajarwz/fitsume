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
import { STARTER_MARKDOWN } from '../lib/starter.js'
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
 *
 * Ten percent a step, because that is the scale people read percentages in:
 * 100, 110, 120. Quarter steps gave 125, 175 and 225, which reads like a glitch.
 */
const ZOOM_MIN = 0.5
const ZOOM_MAX = 3
const ZOOM_STEP = 0.1

const clampZoom = (value) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100))

export default function BuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { resumes, actions } = useStashContext()
  const [tab, setTab] = useState('write')
  const [zoom, setZoom] = useState(1)
  const [focus, setFocus] = useState(false)
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

  const exportPdf = () => exportToPdf({ container: sheet.current, markdown })

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
    // flex-1 rather than h-full: in the stacked layout this is a flex item of a column,
    // and a percentage height against a flex item does not resolve — which is how the
    // preview collapsed to the height of the little zoom rail (135px on a phone) and the
    // page fitted itself into that strip. flex-1 grows in a column and is ignored in a
    // grid cell, where stretching already fills the row.
    <div
      className={
        stacked ? 'flex min-h-0 flex-1 w-full flex-col gap-2' : 'flex min-h-0 flex-1 w-full'
      }
    >
      {/* The controls run down the left edge rather than across the top: a toolbar costs
          the page its height, and height is the axis this page is short of. On a phone it
          is the opposite — the width is what is short — so there the rail lies flat. */}
      <div
        data-no-print
        className={
          stacked
            ? 'flex w-full shrink-0 flex-row items-center gap-2 text-[10px] text-[var(--muted-foreground)]'
            : 'flex w-16 shrink-0 flex-col gap-1 p-3 text-[10px] text-[var(--muted-foreground)]'
        }
      >
        {stacked ? null : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFocus((current) => !current)}
            aria-pressed={focus}
            title={
              focus ? 'Show the editor and the fit controls again' : 'Hide everything but the page'
            }
          >
            {focus ? 'Exit' : 'Full'}
          </Button>
        )}

        <div className={stacked ? 'flex flex-row items-center gap-1' : 'mt-2 flex flex-col gap-1'}>
          <Button
            variant="ghost"
            onClick={() => setZoom((current) => clampZoom(current + ZOOM_STEP))}
            disabled={zoom >= ZOOM_MAX}
            aria-label="Zoom in"
            title="Zoom in"
          >
            +
          </Button>
          <span className="text-center tabular-nums">
            {zoom === 1 ? 'Fit' : `${Math.round(zoom * 100)}%`}
          </span>
          <Button
            variant="ghost"
            onClick={() => setZoom((current) => clampZoom(current - ZOOM_STEP))}
            disabled={zoom <= ZOOM_MIN}
            aria-label="Zoom out"
            title="Zoom out"
          >
            −
          </Button>
          {zoom === 1 ? null : (
            <Button size="sm" onClick={() => setZoom(1)} title="Fit the whole page to the pane">
              Fit
            </Button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <ResumeSheet pages={fit.pages} padding={settings.padding} stackRef={sheet} zoom={zoom} />
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
        onNew={() =>
          navigate(
            `/resume/${actions.create({ name: 'New resume', markdown: STARTER_MARKDOWN }).id}`,
          )
        }
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
        <div
          className={
            focus
              ? 'flex min-h-0 flex-1 p-3'
              : 'grid min-h-0 flex-1 grid-cols-[minmax(18rem,0.9fr)_minmax(20rem,1.5fr)_minmax(11rem,15rem)] gap-3 p-3'
          }
        >
          {focus ? null : (
            <section className="flex min-h-0 flex-col rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
              {editor}
            </section>
          )}

          {/* The page takes the middle and the full height: the sheet fits the pane
              in both directions, so the taller this column, the bigger the page —
              which is why the fit controls sit off to the right instead of under the
              editor. */}
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]">
            {preview}
          </section>

          {focus ? null : (
            <section className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
              <h2 className="text-xs font-semibold">Auto-fit</h2>
              {controls}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
