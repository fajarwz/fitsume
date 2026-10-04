import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App.jsx'

/* The fit engine runs for real here, so the optional `canvas` dependency must be
   installed for them to pass; skip without it. */
const hasCanvas = (() => {
  try {
    if (typeof document === 'undefined') return false
    return Boolean(document.createElement('canvas').getContext('2d'))
  } catch {
    return false
  }
})()

const editor = () => screen.getByLabelText(/resume markdown/i)

describe.skipIf(!hasCanvas)('Fitsume', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.location.hash = ''
  })

  it('greets a new user with a choice, not with a stranger’s resume', async () => {
    render(<App />)

    expect(await screen.findByText(/no resumes yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start from scratch/i })).toBeInTheDocument()
  })

  it('goes from nothing to a fitted page', async () => {
    const user = userEvent.setup()

    render(<App />)
    await user.click(await screen.findByRole('button', { name: /start from scratch/i }))

    expect(editor()).toBeInTheDocument()

    await user.type(editor(), '# Ada Lovelace\nMathematician\nLondon')

    await waitFor(() => expect(document.body.textContent).toMatch(/Fitted at/), { timeout: 4000 })
    expect(document.querySelector('[data-page]')).toBeTruthy()
  })

  it('keeps the work when the page is reloaded', async () => {
    const user = userEvent.setup()
    const first = render(<App />)

    await user.click(await screen.findByRole('button', { name: /start from scratch/i }))
    await user.type(editor(), '# Grace Hopper')

    await waitFor(() => expect(window.localStorage.length).toBeGreaterThan(0), { timeout: 3000 })

    first.unmount()

    render(<App />)

    expect(await screen.findByLabelText(/resume markdown/i)).toHaveValue('# Grace Hopper')
  })

  it('exports under the name of the resume on screen', async () => {
    const user = userEvent.setup()
    const titles = []

    vi.spyOn(window, 'print').mockImplementation(() => {
      titles.push(document.title)
    })

    render(<App />)
    await user.click(await screen.findByRole('button', { name: /start from scratch/i }))
    await user.type(editor(), '# Ada Lovelace')

    await user.click(screen.getByRole('button', { name: /export pdf/i }))

    expect(titles).toContain('Ada Lovelace Resume')
  })
})
