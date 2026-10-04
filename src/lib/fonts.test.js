import { describe, expect, it } from 'vitest'

import { RESUME_FONT_FAMILY, resumeFont, whenFontsReady } from './fonts.js'

describe('resumeFont', () => {
  it('produces a CSS font shorthand the canvas and the DOM can both use', () => {
    expect(resumeFont({ fontSize: 11 })).toBe(`11px ${RESUME_FONT_FAMILY}`)
  })

  it('includes the weight for bold blocks', () => {
    expect(resumeFont({ bold: true, fontSize: 16.5 })).toBe(`bold 16.5px ${RESUME_FONT_FAMILY}`)
  })

  it('defaults to not bold', () => {
    expect(resumeFont({ fontSize: 12 })).not.toContain('bold')
  })

  it('names the self-hosted family first, so a missing font cannot silently win', () => {
    expect(RESUME_FONT_FAMILY.startsWith("'Geist Variable'")).toBe(true)
  })
})

describe('whenFontsReady', () => {
  it('resolves immediately when there is no font API to wait for', async () => {
    await expect(whenFontsReady(undefined)).resolves.toBeUndefined()
    await expect(whenFontsReady({})).resolves.toBeUndefined()
  })

  it('resolves immediately when the fonts are already loaded', async () => {
    await expect(whenFontsReady({ fonts: { status: 'loaded' } })).resolves.toBeUndefined()
  })

  it('waits for the font loading promise otherwise', async () => {
    let settled = false
    const fonts = {
      status: 'loading',
      ready: Promise.resolve().then(() => {
        settled = true
      }),
    }

    await whenFontsReady({ fonts })

    expect(settled).toBe(true)
  })

  it('does not reject when font loading fails', async () => {
    const fonts = { status: 'loading', ready: Promise.reject(new Error('nope')) }

    await expect(whenFontsReady({ fonts })).resolves.toBeUndefined()
  })
})
