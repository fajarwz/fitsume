import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import '@testing-library/jest-dom/vitest'

import CheatSheet from './CheatSheet.tsx'

/* The sheet's own behaviour: it opens over the editor, and it gets out of the way. */

const row = () => screen.getByText(/markdown cheat sheet/i)

const sheet = () => row().closest('details') as HTMLDetailsElement

/* The row's positioning box, which is also the panel's parent. */
const box = () => row().closest('div') as HTMLDivElement

const panel = () => screen.getByText('Undo').closest('div') as HTMLDivElement

describe('CheatSheet', () => {
  it('opens and closes from its own row', async () => {
    const user = userEvent.setup()

    render(<CheatSheet />)

    expect(sheet()).not.toHaveAttribute('open')
    expect(screen.queryByText('Undo')).toBeNull()

    await user.click(row())
    expect(sheet()).toHaveAttribute('open')
    expect(screen.getByText('Undo')).toBeInTheDocument()

    await user.click(row())
    expect(sheet()).not.toHaveAttribute('open')
  })

  it('floats the open sheet, so opening it cannot move the editor', async () => {
    const user = userEvent.setup()

    render(<CheatSheet />)

    await user.click(row())

    // Taken out of the flow and anchored to the row: in the flow it would take its height
    // out of the field below, which is what used to resize the preview.
    expect(box().className).toContain('relative')
    expect(panel().className).toContain('absolute')
    expect(panel().className).toContain('top-full')
  })

  it('keeps the panel out of the row, so its blur can reach the field behind it', async () => {
    const user = userEvent.setup()

    render(<CheatSheet />)

    await user.click(row())

    // A blurred element is the blur boundary for its own contents, so the panel has to sit
    // outside the blurred row to have anything to blur.
    expect(sheet().contains(panel())).toBe(false)
    expect(panel().className).toContain('glass-strong')
  })

  it('stays open when the click lands inside it', async () => {
    const user = userEvent.setup()

    render(<CheatSheet />)

    await user.click(row())
    await user.click(screen.getByText('Export PDF'))

    expect(sheet()).toHaveAttribute('open')
  })

  it('closes when the click lands anywhere else', async () => {
    const user = userEvent.setup()

    render(<CheatSheet />)

    await user.click(row())
    await user.click(document.body)

    expect(sheet()).not.toHaveAttribute('open')
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()

    render(<CheatSheet />)

    await user.click(row())
    await user.keyboard('{Escape}')

    expect(sheet()).not.toHaveAttribute('open')
  })
})
