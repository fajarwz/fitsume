/**
 * A deterministic stand-in for the real text metrics.
 *
 * jsdom has no font engine, so the real measurement cannot run in unit tests. The
 * fit engine is pure arithmetic over whatever metrics it is handed, so these
 * tests hand it a predictable one: a fixed advance per character, and therefore
 * a line count that grows as the font grows.
 *
 * The one property that matters for the layout/measure equality test is that
 * `measure` and `lines` agree on the line count — exactly as the real engine
 * does, since both use the same line breaking.
 */
const FONT_SIZE_PATTERN = /(\d+(?:\.\d+)?)px/

export function fontSizeFromFont(font) {
  const match = FONT_SIZE_PATTERN.exec(String(font))

  return match ? Number(match[1]) : 16
}

export function createFakeMetrics({ advanceRatio = 0.55 } = {}) {
  const counts = { measure: 0, lines: 0 }

  function advanceFor(fontSize) {
    return Math.max(advanceRatio * fontSize, 0.0001)
  }

  function charsPerLine(fontSize, maxWidth) {
    return Math.max(Math.floor(maxWidth / advanceFor(fontSize)), 1)
  }

  function lineCountFor(text, fontSize, maxWidth) {
    return Math.max(1, Math.ceil(text.length / charsPerLine(fontSize, maxWidth)))
  }

  return {
    counts,

    measure(text, { font, maxWidth, lineHeight }) {
      counts.measure += 1

      const count = lineCountFor(text, fontSizeFromFont(font), maxWidth)

      return { height: count * lineHeight, lineCount: count }
    },

    lines(text, { font, maxWidth, lineHeight }) {
      counts.lines += 1

      const fontSize = fontSizeFromFont(font)
      const perLine = charsPerLine(fontSize, maxWidth)
      const count = lineCountFor(text, fontSize, maxWidth)

      return {
        lineCount: count,
        height: count * lineHeight,
        lines: Array.from({ length: count }, (_, index) => ({
          text: text.slice(index * perLine, (index + 1) * perLine),
          width: perLine * advanceFor(fontSize),
        })),
      }
    },
  }
}
