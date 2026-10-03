import { useRef, useState } from 'react'

import FitPanel from '../components/builder/FitPanel.jsx'
import MarkdownEditor from '../components/builder/MarkdownEditor.jsx'
import ResumeSheet from '../components/builder/ResumeSheet.jsx'
import TopBar from '../components/layout/TopBar.jsx'
import SamplePicker, { FirstRunChooser } from '../components/samples/SamplePicker.jsx'
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

export default function BuilderPage() {
  const { resumes, active, actions, saveResult } = useStashContext()
  const [tab, setTab] = useState('write')
  const [samplesOpen, setSamplesOpen] = useState(false)
  const sheet = useRef(null)
  const stacked = useMediaQuery('(max-width: 1000px)')

  const markdown = active?.markdown ?? ''
  const settings = active?.settings ?? DEFAULT_RESUME_SETTINGS
  const settled = useDebouncedValue(markdown, 160)
  const fit = useFit(settled, settings)

  if (!active) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <FirstRunChooser
          onStartBlank={() => actions.create({ name: 'My resume', markdown: '' })}
          onUseSample={(sample) => actions.create({ name: sample.label, markdown: sample.markdown })}
        />
      </div>
    )
  }

  const update = (patch) => actions.update(active.id, patch)

  const exportPdf = () => exportToPdf({ page: sheet.current, markdown })

  const downloadMarkdown = () =>
    downloadText({ filename: markdownFilename(active.name), text: exportResumeMarkdown(active) })

  const editor = (
    <MarkdownEditor
      markdown={markdown}
      resumeId={active.id}
      onChange={(next) => update({ markdown: next })}
      onExport={exportPdf}
      onDownloadMarkdown={downloadMarkdown}
      footer={
        samplesOpen ? (
          <SamplePicker
            hasContent={markdown.trim().length > 0}
            onUseSample={(sample) => {
              update({ markdown: sample.markdown })
              setSamplesOpen(false)
            }}
            onClose={() => setSamplesOpen(false)}
          />
        ) : null
      }
    />
  )

  const preview = (
    <ResumeSheet
      positioned={fit.positioned}
      padding={settings.padding}
      overflow={fit.overflow}
      sheetRef={sheet}
    />
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
        resume={active}
        onChangeResume={actions.select}
        onNew={() => actions.create({ name: 'New resume', markdown: '' })}
        onExport={exportPdf}
        secondary={
          <>
            <Button size="sm" onClick={() => setSamplesOpen((open) => !open)}>
              Samples
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={downloadMarkdown}
              title="Download .md (Ctrl+S)"
            >
              .md
            </Button>
          </>
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
          <section className="flex flex-1 flex-col rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
            <div className={tab === 'write' ? 'contents' : 'hidden'}>{editor}</div>
            <div className={tab === 'preview' ? 'contents' : 'hidden'}>{preview}</div>
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
          <section className="flex min-h-0 flex-col items-center overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
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
