import { useEffect, useRef } from 'react'
import type { ComponentType, KeyboardEvent, ReactNode } from 'react'

import Button from '../ui/Button.tsx'
import CheatSheet from './CheatSheet.tsx'
import { LinkIcon, ListIcon, RedoIcon, RuleIcon, UndoIcon } from '../ui/icons.tsx'
import { useUndo } from '../../hooks/useUndo.ts'

/* Plain markdown textarea on purpose: the fit engine needs the document as text. H2 and H3
   keep their letters; the rest of the toolbar is drawn. */
interface Tool {
  label: string
  title: string
  prefix: string
  Icon?: ComponentType<{ className?: string }>
  /** Drawn instead of labelled; the label becomes the aria-label. */
  iconOnly?: boolean
}

const TOOLS: Tool[] = [
  { label: 'H2', title: 'Section heading', prefix: '## ' },
  { label: 'H3', title: 'Item heading', prefix: '### ' },
  { label: 'Bullet', title: 'Bullet', prefix: '- ', Icon: ListIcon, iconOnly: true },
]

/* Placeholder syntax, not a dialog: it resolves as a live link the moment it lands. */
const LINK_ADDRESS = 'example.com'
const LINK_LABEL = 'label'
const LINK_PLACEHOLDER = `[${LINK_LABEL}](${LINK_ADDRESS})`

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

/**
 * The label of a link is one line of source, so a selection that spans lines is joined
 * into one. A newline left inside the brackets makes no link at all: the parser reads
 * the document line by line, so the brackets would simply print as typed.
 */
function labelFrom(selected: string): string {
  return selected.replace(/\s+/g, ' ').trim()
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

  /**
   * The Link button, both directions in one.
   *
   * With text selected, that text is the label and the address placeholder is what
   * stays selected, because the address is the part still left to write. With nothing
   * selected it falls back to `[label](example.com)` and selects the label instead.
   *
   * The field takes focus back either way: the click that got here landed on a button,
   * which took the caret with it, and the insert is only useful if the next keystroke
   * goes into the document.
   */
  const insertLink = () => {
    const element = textarea.current

    if (!element) return

    const { selectionStart: start, selectionEnd: end, value } = element
    const label = labelFrom(value.slice(start, end))

    if (label === '') {
      pendingSelection.current = [start + 1, start + 1 + LINK_LABEL.length]
      onChange(`${value.slice(0, start)}${LINK_PLACEHOLDER}${value.slice(end)}`)
      element.focus()

      return
    }

    const inserted = `[${label}](${LINK_ADDRESS})`
    // The last `](` is the one this insert just added, which is where the address
    // starts even if the label itself contains a bracket.
    const address = start + inserted.lastIndexOf('](') + 2

    pendingSelection.current = [address, address + LINK_ADDRESS.length]
    onChange(`${value.slice(0, start)}${inserted}${value.slice(end)}`)
    element.focus()
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
            aria-label={tool.iconOnly ? tool.title : undefined}
            className={tool.iconOnly ? 'px-2' : undefined}
            onClick={() => edit((element) => prefixSelection(element, tool.prefix))}
          >
            {tool.Icon ? <tool.Icon className="h-4 w-4" /> : null}
            {tool.iconOnly ? null : tool.label}
          </Button>
        ))}
        <Button
          size="sm"
          variant="ghost"
          title="Horizontal rule"
          aria-label="Horizontal rule"
          className="px-2"
          onClick={() =>
            edit((element) => {
              const at = element.selectionStart
              const value = `${element.value.slice(0, at)}\n---\n${element.value.slice(at)}`

              return { value, caret: at + 5 }
            })
          }
        >
          <RuleIcon className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          title={`Link the selected text, or insert ${LINK_PLACEHOLDER}`}
          onClick={insertLink}
        >
          <LinkIcon className="h-4 w-4" />
          Link
        </Button>

        <div className="ml-auto flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="px-2"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
          >
            <UndoIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="px-2"
            onClick={redo}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
          >
            <RedoIcon className="h-4 w-4" />
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
