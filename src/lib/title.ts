/**
 * The resume's name, used for the document title and the exported file name.
 *
 * Pure and framework-free: no DOM, no React, no knowledge of the editor. That
 * matters because getting this wrong is exactly what made the previous
 * implementation export every PDF as "Milo Vex Resume" — the title was derived
 * from a stale closure, not from the document on screen.
 */
const TITLE_PATTERN = /^#[ \t]+(.+?)[ \t]*$/m

const FALLBACK_TITLE = 'Resume'

export function deriveTitle(markdown: unknown): string {
  if (typeof markdown !== 'string') return FALLBACK_TITLE

  const match = TITLE_PATTERN.exec(markdown)
  const title = match?.[1]?.trim()

  return title ? title : FALLBACK_TITLE
}