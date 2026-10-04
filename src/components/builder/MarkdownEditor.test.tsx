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
})
