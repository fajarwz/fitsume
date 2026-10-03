import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import ResumeSheet from './ResumeSheet.jsx'
import { PAGE_HEIGHT, PAGE_WIDTH } from '../../lib/page.js'

/**
 * jsdom has no layout, so the pane's client box is stubbed — that box is the only
 * input to the fit, and everything else here is arithmetic.
 *
 * The behaviour being pinned: the page fits the pane in *both* directions (so the
 * whole sheet is visible without scrolling), and zoom multiplies that fit rather
 * than replacing it.
 */
const PANE = { width: 400, height: 500 }

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => PANE.width,
  })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => PANE.height,
  })
})

afterEach(() => {
  delete HTMLElement.prototype.clientWidth
  delete HTMLElement.prototype.clientHeight
})

const pageBox = (container) => container.querySelector('[data-page]').parentElement.style
const fitScale = Math.min(PANE.width / PAGE_WIDTH, PANE.height / PAGE_HEIGHT)

describe('ResumeSheet', () => {
  it('fits the whole page into the pane, so nothing needs scrolling', () => {
    const { container } = render(<ResumeSheet positioned={[]} padding={40} />)

    // Width alone would allow 400/620; the height is the tighter constraint, and
    // taking only the width is what used to push the bottom of the page off-screen.
    expect(parseFloat(pageBox(container).height)).toBeCloseTo(PANE.height, 1)
    expect(parseFloat(pageBox(container).width)).toBeCloseTo(PAGE_WIDTH * fitScale, 1)
    expect(parseFloat(pageBox(container).width)).toBeLessThan(PANE.width)
  })

  it('keeps the A4 proportions while fitting', () => {
    const { container } = render(<ResumeSheet positioned={[]} padding={40} />)

    expect(
      parseFloat(pageBox(container).width) / parseFloat(pageBox(container).height),
    ).toBeCloseTo(PAGE_WIDTH / PAGE_HEIGHT, 3)
  })

  it('multiplies the fit by the zoom, and lets it overflow the pane', () => {
    const { container } = render(<ResumeSheet positioned={[]} padding={40} zoom={2} />)

    // Twice the fit is taller than the pane: that is the case the pane scrolls on.
    expect(parseFloat(pageBox(container).height)).toBeCloseTo(PANE.height * 2, 1)
    expect(parseFloat(pageBox(container).height)).toBeGreaterThan(PANE.height)
  })

  it('scales below the fit when zoomed out', () => {
    const { container } = render(<ResumeSheet positioned={[]} padding={40} zoom={0.5} />)

    expect(parseFloat(pageBox(container).height)).toBeCloseTo(PANE.height * 0.5, 1)
  })
})
