import { useEffect, useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'

import Button from '../ui/Button.tsx'
import CheatSheet from './CheatSheet.tsx'
import { useUndo } from '../../hooks/useUndo.ts'

/* Plain markdown textarea on purpose: the fit engine needs the document as text. */
const TOOLS: Array<{ label: string; title: string; prefix: string }> = [
  { label: 'H2', title: 'Section heading', prefix: '## ' },
  { label: 'H3', title: 'Item heading', prefix: '### ' },
  { label: '•', title: 'Bullet', prefix: '- ' },
]

/* Placeholder syntax, not a dialog: it resolves as a live link the moment it lands. */
const LINK_PLACEHOLDER = '[label](example.com)'

interface SelectionEdit {
  value: string
  caret: number
}

function prefixSelection(textarea: HTMLTextAreaElement, prefix: string): SelectionEdit {
  const { value, selectionStart: start, selectionEnd: end } = textarea
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const endOfBlock = value.indexOf('\n', end)
  const lineEnd = endOfBlock === -1 ? value.length : endOfBlock
  const lines = value.slice(lineStart, lineEnd).split('\n')
  const allPrefixed = lines.every((line) => line.startsWith(prefix))
  const next = lines
    .map((line) => {
      if (allPrefixed) return line.slice(prefix.length)

      return line.startsWith(prefix) ? line : prefix + line
    })
    .join('\n')

  return {
    value: `${value.slice(0, lineStart)}${next}${value.slice(lineEnd)}`,
    caret: lineStart + next.length,
  }
}

function indentSelection(textarea: HTMLTextAreaElement, outdent: boolean): SelectionEdit {
  const { value, selectionStart: start, selectionEnd: end } = textarea
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const endOfBlock = value.indexOf('\n', end)
  const lineEnd = endOfBlock === -1 ? value.length : endOfBlock
  const lines = value.slice(lineStart, lineEnd).split('\n')
  const next = lines.map((line) => (outdent ? line.replace(/^ {1,2}/, '') : `  ${line}`)).join('\n')

  return {
    value: `${value.slice(0, lineStart)}${next}${value.slice(lineEnd)}`,
    caret: lineStart + next.length,
  }
}

export interface MarkdownEditorProps {
  markdown: string
  onChange: (value: string) => void
  resumeId: string
  onExport?: () => void
  onDownloadMarkdown?: () => void
  footer?: ReactNode
}

export default function MarkdownEditor({
  markdown,
  onChange,
  resumeId,
  onExport,
  onDownloadMarkdown,
  footer = null,
}: MarkdownEditorProps) {
  const textarea = useRef<HTMLTextAreaElement | null>(null)
  const pendingCaret = useRef<number | null>(null)
  const pendingSelection = useRef<[number, number] | null>(null)
  const previousResume = useRef<string>(resumeId)

  const { undo, redo, reset, canUndo, canRedo } = useUndo(markdown, onChange)

  // Switching resume is not an edit: the history belongs to the document.
  useEffect(() => {
    if (previousResume.current === resumeId) return

    previousResume.current = resumeId
    reset(markdown)
  }, [resumeId, markdown, reset])

  // Restoring the caret after React has re-rendered the textarea.
  useEffect(() => {
    if (pendingCaret.current === null || !textarea.current) return

    textarea.current.setSelectionRange(pendingCaret.current, pendingCaret.current)
    pendingCaret.current = null
  })

  // Restoring a selection, for the inserts that leave something to type over.
  useEffect(() => {
    if (pendingSelection.current === null || !textarea.current) return

    textarea.current.setSelectionRange(...pendingSelection.current)
    pendingSelection.current = null
  })

  const edit = (compute: (element: HTMLTextAreaElement) => SelectionEdit) => {
    const element = textarea.current

    if (!element) return

    const { value, caret } = compute(element)

    pendingCaret.current = caret
    onChange(value)
  }

  /** Drops the link placeholder at the caret, with the label selected so typing replaces it. */
  const insertPlaceholder = () => {
    const element = textarea.current

    if (!element) return

    const { selectionStart: start, selectionEnd: end, value } = element

    pendingSelection.current = [start + 1, start + 1 + 'label'.length]
    onChange(`${value.slice(0, start)}${LINK_PLACEHOLDER}${value.slice(end)}`)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab indents rather than leaving the field, the way an editor should. It is a
    // deliberate trade against reaching the next control by keyboard, so it is
    // documented in the cheat sheet.
    if (event.key === 'Tab') {
      event.preventDefault()
      edit((element) => indentSelection(element, event.shiftKey))

      return
    }

    const meta = event.metaKey || event.ctrlKey

    if (!meta) return

    const key = event.key.toLowerCase()

    if (key === 'z' && !event.shiftKey) {
      event.preventDefault()
      undo()

      return
    }

    if ((key === 'z' && event.shiftKey) || key === 'y') {
      event.preventDefault()
      redo()

      return
    }

    if (key === 'p' && onExport) {
      event.preventDefault()
      onExport()

      return
    }

    if (key === 's' && onDownloadMarkdown) {
      event.preventDefault()
      onDownloadMarkdown()
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1">
        {TOOLS.map((tool) => (
          <Button
            key={tool.label}
            size="sm"
            variant="ghost"
            title={tool.title}
            onClick={() => edit((element) => prefixSelection(element, tool.prefix))}
          >
            {tool.label}
          </Button>
        ))}
        <Button
          size="sm"
          variant="ghost"
          title="Horizontal rule"
          onClick={() =>
            edit((element) => {
              const at = element.selectionStart
              const value = `${element.value.slice(0, at)}\n---\n${element.value.slice(at)}`

              return { value, caret: at + 5 }
            })
          }
        >
          —
        </Button>
        <Button
          size="sm"
          variant="ghost"
          title={`Insert a link placeholder: ${LINK_PLACEHOLDER}`}
          onClick={insertPlaceholder}
        >
          Link
        </Button>

        <div className="ml-auto flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            Undo
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
          >
            Redo
          </Button>
        </div>
      </div>

      <label className="sr-only" htmlFor="markdown-editor">
        Resume markdown
      </label>
      <CheatSheet />
      <textarea
        id="markdown-editor"
        ref={textarea}
        value={markdown}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        spellCheck="true"
        placeholder={'# Your Name\nYour Title\nCity · email@example.com\n---\n## EXPERIENCE'}
        className="min-h-[18rem] flex-1 resize-none rounded-md border border-[var(--border)] bg-[var(--muted)] p-3 font-mono text-xs leading-relaxed outline-none"
      />
      {footer}
    </div>
  )
}
