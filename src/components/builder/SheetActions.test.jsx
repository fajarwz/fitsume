import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import SheetActions from './SheetActions.jsx'

/* The preview actions as a person uses them; pins the bug where the invisible click-away
   box painted over the menu and swallowed every click. */
const setup = (props = {}) => {
  const actions = {
    onExport: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onFit: vi.fn(),
    onDownloadMarkdown: vi.fn(),
    ...props,
  }

  const view = render(
    <SheetActions
      {...actions}
      zoom={props.zoom ?? 1}
      showFull={props.showFull ?? false}
      onFull={actions.onFull ?? null}
    />,
  )

  return { actions, view }
}

describe('SheetActions', () => {
  it('keeps export reachable without opening anything', async () => {
    const user = userEvent.setup()
    const { actions } = setup()

    await user.click(screen.getByRole('button', { name: /export pdf/i }))

    expect(actions.onExport).toHaveBeenCalledTimes(1)
  })

  it('shows an always-visible exit when in full screen, and it exits', async () => {
    const user = userEvent.setup()
    const { actions } = setup({ full: true, showFull: true, onFull: vi.fn() })

    // Not behind the dots: reachable the moment the mode starts.
    await user.click(screen.getByRole('button', { name: /exit full/i }))

    expect(actions.onFull).toHaveBeenCalledTimes(1)
  })

  it('fires an action from inside the dots, instead of just closing', async () => {
    const user = userEvent.setup()
    const { actions } = setup()

    await user.click(screen.getByRole('button', { name: /more actions/i }))
    await user.click(screen.getByRole('button', { name: /zoom in/i }))

    expect(actions.onZoomIn).toHaveBeenCalledTimes(1)
  })

  it('keeps the dots open after zoom, so a run of taps stays together', async () => {
    const user = userEvent.setup()
    const { actions } = setup()

    await user.click(screen.getByRole('button', { name: /more actions/i }))
    await user.click(screen.getByRole('button', { name: /zoom in/i }))
    await user.click(screen.getByRole('button', { name: /zoom out/i }))

    expect(actions.onZoomIn).toHaveBeenCalledTimes(1)
    expect(actions.onZoomOut).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument()
  })

  it('turns the toggle into a close once the dots are open', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: /more actions/i }))

    expect(screen.getByRole('button', { name: /close actions/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /close actions/i }))

    expect(screen.queryByRole('button', { name: /close actions/i })).not.toBeInTheDocument()
  })

  it('closes the dots after an action runs', async () => {
    const user = userEvent.setup()
    const { actions } = setup()

    await user.click(screen.getByRole('button', { name: /more actions/i }))
    await user.click(screen.getByRole('button', { name: /download \.md/i }))

    expect(actions.onDownloadMarkdown).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: /download \.md/i })).not.toBeInTheDocument()
  })

  it('disables Fit when the page already fits', async () => {
    const user = userEvent.setup()
    setup({ zoom: 1 })

    await user.click(screen.getByRole('button', { name: /more actions/i }))
    expect(screen.getByRole('button', { name: /^fit$/i })).toBeDisabled()
  })

  it('shows the live zoom in the cluster readout', async () => {
    const user = userEvent.setup()
    setup({ zoom: 1.5 })

    await user.click(screen.getByRole('button', { name: /more actions/i }))

    expect(screen.getByRole('button', { name: /150%/i })).toBeInTheDocument()
  })
})
