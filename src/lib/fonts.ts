/**
 * The font stack, in one place.
 *
 * The preview's rendered font and the fit engine's measured font must be the
 * same string. When they diverge, a resume "fits" on screen and overflows in
 * print — which is the whole failure mode this app exists to prevent.
 *
 * 'Geist Variable' is registered by @fontsource-variable/geist, which is bundled
 * into the build. Self-hosted on purpose: a CDN font that fails to load falls
 * back to Arial or Segoe, and the fit would then be measured against metrics the
 * user never sees.
 */
export const RESUME_FONT_FAMILY = "'Geist Variable', Geist, system-ui, sans-serif"

/** CSS font shorthand, identical for measurement and for rendering. */
export function resumeFont({ bold = false, fontSize }: { bold?: boolean; fontSize: number }) {
  return `${bold ? 'bold ' : ''}${fontSize}px ${RESUME_FONT_FAMILY}`
}

/**
 * Resolves once the webfont is available.
 *
 * Measuring before the font loads means measuring the fallback, and the first
 * auto-fit would then be wrong until something forced a re-measure. The document
 * is a parameter so this stays testable without a real DOM.
 */
export function whenFontsReady(doc: unknown = globalThis.document): Promise<void> {
  const fonts = (doc as { fonts?: { status?: string; ready?: Promise<unknown> } })?.fonts
  if (!fonts) return Promise.resolve()

  if (fonts.status === 'loaded') return Promise.resolve()

  return Promise.resolve(fonts.ready).catch(() => undefined) as Promise<void>
}