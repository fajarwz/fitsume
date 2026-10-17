import { useState } from 'react'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import MarkdownEditor from './MarkdownEditor.tsx'

/* The editor's own behaviour: insert tools, Tab indenting, keyboard shortcuts. */
const setup = (markdown = '') => {
  const onChange = vi.fn()

  render(
    <MarkdownEditor
      markdown={markdown}
      onChange={onChange}
      resumeId="r1"
      onExport={vi.fn()}
      onDownloadMarkdown={vi.fn()}
    />,
  )

  return { onChange, field: screen.getByLabelText(/resume markdown/i) }
}

const lastValue = (onChange: ReturnType<typeof vi.fn>) =>
  onChange.mock.calls[onChange.mock.calls.length - 1][0]

/**
 * A controlled editor, because the rest of these tests only read what `onChange` was
 * handed. What the Link button leaves *selected* can only be asserted once the value the
 * field holds is the new one, and that takes state.
 */
function Harness({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial)

  return <MarkdownEditor markdown={value} onChange={setValue} resumeId="r1" />
}

const editorField = () => screen.getByLabelText(/resume markdown/i) as HTMLTextAreaElement

const selectedIn = (area: HTMLTextAreaElement) =>
  area.value.slice(area.selectionStart, area.selectionEnd)

describe('MarkdownEditor', () => {
  it('explains the dialect instead of leaving it to be guessed', () => {
    setup()

    expect(screen.getByText(/markdown cheat sheet/i)).toBeInTheDocument()
    expect(screen.getByText(/the line under it is its dates/i)).toBeInTheDocument()
  })

  it('turns the current line into a section heading', async () => {
    const user = userEvent.setup()
    const { onChange, field } = setup('EXPERIENCE')

    await user.click(screen.getByRole('button', { name: 'H2' }))

    expect(lastValue(onChange)).toBe('## EXPERIENCE')
    expect(field).toBeInTheDocument()
  })

  it('turns the current line into a bullet', async () => {
    const user = userEvent.setup()
    const { onChange } = setup('Shipped the thing')

    await user.click(screen.getByRole('button', { name: '•' }))

    expect(lastValue(onChange)).toBe('- Shipped the thing')
  })

  it('takes the prefix off again when the line already has it', async () => {
    const user = userEvent.setup()
    const { onChange } = setup('## EXPERIENCE')

    await user.click(screen.getByRole('button', { name: 'H2' }))

    expect(lastValue(onChange)).toBe('EXPERIENCE')
  })

  it('indents with Tab, and outdents with Shift+Tab', async () => {
    const user = userEvent.setup()
    const { onChange } = setup('a line')

    await user.click(screen.getByLabelText(/resume markdown/i))
    await user.keyboard('{Tab}')

    expect(lastValue(onChange)).toBe('  a line')

    onChange.mockClear()

    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(lastValue(onChange)).toBe('a line')
  })

  it('leaves the document alone when Tab is not used in the editor', async () => {
    const user = userEvent.setup()
    const { onChange, field } = setup('## SECTION')

    await user.click(field)
    await user.keyboard('x')

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(lastValue(onChange)).toBe('## SECTIONx')
  })

  it('makes the selected text the link label, and selects the address to type over', async () => {
    const user = userEvent.setup()

    render(<Harness initial="See my website for details" />)

    const area = editorField()

    area.setSelectionRange(4, 14)

    await user.click(screen.getByRole('button', { name: 'Link' }))

    expect(area).toHaveValue('See [my website](example.com) for details')
    expect(selectedIn(area)).toBe('example.com')
    // The click landed on a button, which takes the caret with it. It has to come back,
    // or the selected address is a selection nobody can type over.
    expect(area).toHaveFocus()
  })

  it('drops in the placeholder when nothing is selected, with the label to type over', async () => {
    const user = userEvent.setup()

    render(<Harness initial="No link yet" />)

    const area = editorField()

    area.setSelectionRange(4, 4)

    await user.click(screen.getByRole('button', { name: 'Link' }))

    expect(area).toHaveValue('No l[label](example.com)ink yet')
    expect(selectedIn(area)).toBe('label')
  })

  it('joins a selection spanning lines into one label, the only shape a link has', async () => {
    const user = userEvent.setup()

    render(<Harness initial={'first line\nsecond line'} />)

    const area = editorField()

    area.setSelectionRange(0, area.value.length)

    await user.click(screen.getByRole('button', { name: 'Link' }))

    expect(area).toHaveValue('[first line second line](example.com)')
    expect(selectedIn(area)).toBe('example.com')
  })
})
