import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DEFAULT_RESUME_SETTINGS } from '../../lib/settings.js'
import FitPanel from './FitPanel.jsx'

/* The fit readout here is measured for real; that needs the optional `canvas`
   package, so skip without it. */
const hasCanvas = (() => {
  try {
    if (typeof document === 'undefined') return false
    return Boolean(document.createElement('canvas').getContext('2d'))
  } catch {
    return false
  }
})()

/* The fit controls as a person uses them: numbers arrive intact, readout tells the truth. */
const setup = ({ settings = {}, fit = {} } = {}) => {
  const onChange = vi.fn()
  const merged = { ...DEFAULT_RESUME_SETTINGS, ...settings }
  const view = render(
    <FitPanel
      settings={merged}
      fit={{ fontSize: 11, lineHeightMultiplier: 1.4, overflow: 0, ...fit }}
      onChange={onChange}
    />,
  )

  return { onChange, view }
}

describe.skipIf(!hasCanvas)('FitPanel', () => {
  it('reports what auto-fit chose', () => {
    setup()

    expect(screen.getByText(/11.0px/)).toBeInTheDocument()
    expect(screen.getByText(/1.40×/)).toBeInTheDocument()
  })

  it('disables the size sliders auto-fit is overriding', () => {
    setup()

    expect(screen.getByLabelText(/font size/i)).toBeDisabled()
    expect(screen.getByLabelText(/line spacing/i)).toBeDisabled()
  })

  it('hands the numbers back when auto-fit is switched off', async () => {
    const user = userEvent.setup()
    const { onChange } = setup()

    await user.click(screen.getByRole('button', { name: /auto-fit/i }))

    expect(onChange).toHaveBeenCalledWith({ autoFit: false })
  })

  it('carries a font size change through', () => {
    const { onChange } = setup({ settings: { autoFit: false } })

    // jsdom does not implement keyboard handling for range inputs, so the change is
    // delivered the way the browser would deliver a drag.
    fireEvent.change(screen.getByLabelText(/font size/i), { target: { value: '12' } })

    expect(onChange).toHaveBeenCalledWith({ baseFontSize: 12 })
  })

  it('changes one spacing value without disturbing the others', () => {
    const { onChange } = setup()

    fireEvent.change(screen.getByLabelText(/item spacing/i), { target: { value: '18' } })

    const patch = onChange.mock.calls[0][0]

    expect(patch.spacing).toEqual({
      item: 18,
      section: DEFAULT_RESUME_SETTINGS.spacing.section,
      separator: DEFAULT_RESUME_SETTINGS.spacing.separator,
    })
  })

  it('carries the margin through', () => {
    const { onChange } = setup()

    fireEvent.change(screen.getByLabelText(/page margin/i), { target: { value: '56' } })

    expect(onChange).toHaveBeenCalledWith({ padding: 56 })
  })

  it('says how far past the page a hand-sized resume goes', () => {
    setup({ settings: { autoFit: false }, fit: { overflow: 42 } })

    expect(screen.getByRole('status')).toHaveTextContent(/42px past the bottom/i)
  })

  it('does not cry overflow when the document fits', () => {
    setup({ settings: { autoFit: false }, fit: { overflow: 0 } })

    expect(screen.getByRole('status')).toHaveTextContent(/room to spare/i)
  })
})
