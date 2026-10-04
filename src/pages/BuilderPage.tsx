import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import FitPanel from '../components/builder/FitPanel.tsx'
import MarkdownEditor from '../components/builder/MarkdownEditor.tsx'
import ResumeSheet from '../components/builder/ResumeSheet.tsx'
import type { ResumeSheetPage } from '../components/builder/ResumeSheet.tsx'
import SheetActions from '../components/builder/SheetActions.tsx'
import TopBar from '../components/layout/TopBar.tsx'
import Button from '../components/ui/Button.tsx'
import Text from '../components/ui/Text.tsx'
import { useDebouncedValue } from '../hooks/useDebouncedValue.ts'
import { useFit } from '../hooks/useFit.ts'
import { useMediaQuery } from '../hooks/useMediaQuery.ts'
import { downloadText, exportResumeMarkdown, markdownFilename } from '../lib/files.ts'
import { exportToPdf } from '../lib/pdf.ts'
import { DEFAULT_RESUME_SETTINGS } from '../lib/settings.ts'
import type { ResumeSettings } from '../lib/settings.ts'
import { STARTER_MARKDOWN } from '../lib/starter.ts'
import { useStashContext } from '../state/StashProvider.tsx'

/**
 * Fit measures a debounced copy of the markdown; the open resume and its
 * settings come straight from the library, with no second copy to keep in step.
 */
const TABS: Array<[string, string]> = [
  ['write', 'Write'],
  ['preview', 'Preview'],
  ['settings', 'Fit'],
]

/**
 * Session-state zoom on purpose: a saved zoom would be stale in a smaller window.
 */
const ZOOM_MIN = 0.5
const ZOOM_MAX = 3
const ZOOM_STEP = 0.1

const clampZoom = (value: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100))

type SettingsPatch = {
  name?: string
  markdown?: string
  settings?: Partial<ResumeSettings>
}

export default function BuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { resumes, actions } = useStashContext()
  const [tab, setTab] = useState('write')
  const [zoom, setZoom] = useState(1)
  const [focus, setFocus] = useState(false)
  const sheet = useRef<HTMLDivElement | null>(null)
  const previewTarget = useRef<HTMLDivElement | null>(null)
  const stacked = useMediaQuery('(max-width: 1000px)')

  // The URL is the source of truth; the library's active id follows it.
  const resume = resumes.find((entry) => entry.id === id) ?? null
  const activeId = resume?.id ?? null

  useEffect(() => {
    if (activeId) actions.select(activeId)
  }, [activeId, actions])

  useEffect(() => {
    if (!focus) return undefined

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFocus(false)
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [focus])

  // The browser's own Esc exits real fullscreen without telling React, so sync state here.
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setFocus(false)
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)

    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    if (focus) {
      document.exitFullscreen?.()
      setFocus(false)

      return
    }

    setFocus(true)
    const target = previewTarget.current

    if (target?.requestFullscreen) {
      target.requestFullscreen()?.catch?.(() => {})
    }
  }

  const markdown = resume?.markdown ?? ''
  const settings = resume?.settings ?? DEFAULT_RESUME_SETTINGS
  const settled = useDebouncedValue(markdown, 160)
  const fit = useFit(settled, settings)

  if (!resume) return <Navigate to="/" replace />

  const update = (patch: SettingsPatch) => actions.update(resume.id, patch)

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
    // flex-1, not h-full: a percentage height against a flex-item column does not
    // resolve, and the preview would collapse to the zoom rail's height.
    <div
      ref={previewTarget}
      className={
        stacked
          ? 'relative flex min-h-0 flex-1 w-full flex-col'
          : 'relative flex min-h-0 flex-1 w-full'
      }
    >
      <ResumeSheet
        pages={fit.pages as ResumeSheetPage[]}
        padding={settings.padding}
        stackRef={sheet}
        zoom={zoom}
        onWheelZoom={(direction) =>
          setZoom((current) => clampZoom(current + direction * ZOOM_STEP))
        }
      />

      <SheetActions
        onExport={exportPdf}
        onZoomIn={() => setZoom((current) => clampZoom(current + ZOOM_STEP))}
        onZoomOut={() => setZoom((current) => clampZoom(current - ZOOM_STEP))}
        onFit={() => setZoom(1)}
        onFull={toggleFullscreen}
        full={focus}
        showFull={!stacked}
        zoom={zoom}
        onDownloadMarkdown={downloadMarkdown}
      />
    </div>
  )

  const controls = (
    <FitPanel
      settings={settings}
      fit={{
        fontSize: fit.fontSize,
        lineHeightMultiplier: fit.lineHeightMultiplier,
        pageCount: fit.pageCount,
        overflow: 0,
      }}
      onChange={(patch) =>
        update({
          settings: { ...settings, ...patch, spacing: { ...settings.spacing, ...patch.spacing } },
        })
      }
    />
  )

  return (
    <div className="flex min-h-screen flex-col text-[var(--foreground)]">
      <TopBar
        resume={resume}
        onNew={() =>
          navigate(
            `/resume/${actions.create({ name: 'New resume', markdown: STARTER_MARKDOWN }).id}`,
          )
        }
      />

      {stacked ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
          <div className="flex gap-1 print:hidden" role="tablist" aria-label="Editor, preview or fit">
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
          <section className="flex min-h-0 flex-1 flex-col rounded-lg border border-[var(--border)] bg-[var(--glass)] p-3 backdrop-blur-xl print:border-0 print:bg-transparent print:p-0">
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
            <section
              data-no-print
              className="flex min-h-0 flex-col rounded-lg border border-[var(--border)] bg-[var(--glass)] p-3 backdrop-blur-xl"
            >
              {editor}
            </section>
          )}

          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] print:border-0 print:bg-transparent">
            {preview}
          </section>

          {focus ? null : (
            <section
              data-no-print
              className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--glass)] p-3 backdrop-blur-xl"
            >
              <Text as="h2" variant="12-semibold">
                Auto-fit
              </Text>
              {controls}
            </section>
          )}
        </div>
      )}
    </div>
  )
}