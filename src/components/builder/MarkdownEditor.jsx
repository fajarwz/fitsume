import { useEffect, useRef, useState } from 'react'

import Button from '../ui/Button.jsx'
import CheatSheet from './CheatSheet.jsx'
import { insertLinkAt } from '../../lib/links.js'
import { useUndo } from '../../hooks/useUndo.js'

/**
 * The markdown editor: a textarea, a small insert toolbar, and undo that behaves.
 *
 * Markdown rather than a rich-text surface on purpose — the fit engine needs the
 * document as text, and a plain textarea keeps the caret, the platform's own
 * spell-check, and the keyboard shortcuts working.
 */
const TOOLS = [
  { label: 'H2', title: 'Section heading', prefix: '## ' },
  { label: 'H3', title: 'Item heading', prefix: '### ' },
  { label: '•', title: 'Bullet', prefix: '- ' },
]

/** Prefixes the lines the selection touches, and un-prefixes them if they all have it. */
function prefixSelection(textarea, prefix) {
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

/** Adds or removes two spaces at the start of the lines the selection touches. */
function indentSelection(textarea, outdent) {
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

export default function MarkdownEditor({
  markdown,
  onChange,
  resumeId,
  onExport,
  onDownloadMarkdown,
  footer = null,
}) {
  const textarea = useRef(null)
  const addressInput = useRef(null)
  const pendingCaret = useRef(null)
  const previousResume = useRef(resumeId)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkLabel, setLinkLabel] = useState('')
  const [linkAddress, setLinkAddress] = useState('')

  // Focused by hand rather than with autoFocus: the field only appears because someone
  // asked for it, and the lint rule against autoFocus exists for the fields that appear
  // whether you asked or not.
  useEffect(() => {
    if (linkOpen) addressInput.current?.focus()
  }, [linkOpen])

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

  const edit = (compute) => {
    const element = textarea.current

    if (!element) return

    const { value, caret } = compute(element)

    pendingCaret.current = caret
    onChange(value)
  }

  const closeLink = () => {
    setLinkOpen(false)
    setLinkLabel('')
    setLinkAddress('')
  }

  /**
   * Writes a link at the caret, by way of the same function the checks exercise.
   */
  const insertLink = () => {
    const element = textarea.current

    if (!element) return

    const inserted = insertLinkAt(element.value, [element.selectionStart, element.selectionEnd], {
      label: linkLabel,
      address: linkAddress,
    })

    if (!inserted) return

    pendingCaret.current = inserted.caret
    onChange(inserted.value)
    closeLink()
  }

  const onLinkKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      insertLink()

      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closeLink()
    }
  }

  const onKeyDown = (event) => {
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
          variant={linkOpen ? 'primary' : 'ghost'}
          title="Add a link: an address on its own, or a label that hides one"
          aria-expanded={linkOpen}
          onClick={() => (linkOpen ? closeLink() : setLinkOpen(true))}
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

      {linkOpen && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--muted)] p-1.5">
          <label className="sr-only" htmlFor="link-label">
            Link label
          </label>
          <input
            id="link-label"
            value={linkLabel}
            onChange={(event) => setLinkLabel(event.target.value)}
            onKeyDown={onLinkKeyDown}
            placeholder="Label (optional)"
            title="Leave blank to insert the address on its own; selected text is used as the label"
            className="h-7 w-36 rounded border border-[var(--border)] bg-[var(--card)] px-2 text-xs outline-none"
          />
          <label className="sr-only" htmlFor="link-address">
            Link address
          </label>
          <input
            id="link-address"
            ref={addressInput}
            value={linkAddress}
            onChange={(event) => setLinkAddress(event.target.value)}
            onKeyDown={onLinkKeyDown}
            placeholder="fajarwz.com"
            title="An email address, or a web address with or without the https://"
            className="h-7 w-44 rounded border border-[var(--border)] bg-[var(--card)] px-2 font-mono text-xs outline-none"
          />
          <Button
            size="sm"
            variant="primary"
            onClick={insertLink}
            disabled={linkAddress.trim() === ''}
          >
            Insert
          </Button>
          <Button size="sm" variant="ghost" onClick={closeLink}>
            Cancel
          </Button>
        </div>
      )}

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
