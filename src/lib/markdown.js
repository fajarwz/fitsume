import { hrefFor } from './links.js'

/**
 * The markdown dialect: `#`, `##`, `###`, `- `, `---`, and blank lines. Nothing
 * else, and deliberately so — this is a resume, not a blogging platform.
 *
 * Some of the styling rules below look arbitrary because they are. Three exist
 * only to make a conventional resume header work:
 *
 *   - the line after `# Name`       becomes the subtitle (the role)
 *   - the line after that           becomes faint metadata (location · email · links)
 *   - the line after a `### Item`   becomes faint metadata (dates, employer)
 *
 * They are preserved exactly, because the samples and every fit result depend on
 * them, and the tests pin each one. Note the two metadata styles are distinct:
 * the one under a job title is tighter than the one under the header.
 */
const STYLES = {
  title: { fontScale: 1.5, bold: true, marginBottom: 4, color: 'ink', keepWithNext: true },
  subtitle: {
    fontScale: 1,
    bold: false,
    marginBottom: 6,
    color: 'inkMuted',
    keepWithNext: true,
  },
  meta: { fontScale: 0.8, bold: false, marginBottom: 16, color: 'inkFaint' },
  itemMeta: { fontScale: 0.8, bold: false, marginBottom: 6, color: 'inkFaint' },
  section: {
    fontScale: 0.85,
    bold: true,
    marginBottom: 3,
    color: 'inkFaint',
    spaceBefore: 'section',
    keepWithNext: true,
  },
  item: {
    fontScale: 1,
    bold: true,
    marginBottom: 2,
    color: 'ink',
    spaceBefore: 'item',
    keepWithNext: true,
  },
  itemAfterSection: {
    fontScale: 1,
    bold: true,
    marginBottom: 2,
    color: 'ink',
    keepWithNext: true,
  },
  bullet: { fontScale: 1, bold: false, marginBottom: 3, color: 'inkMuted' },
  body: { fontScale: 1, bold: false, marginBottom: 6, color: 'ink' },
}

const BULLET_PREFIX = '- '
const BULLET_GLYPH = '\u2022 '
const HORIZONTAL_RULE = '---'

export const BLOCK_TYPE = {
  text: 'text',
  rule: 'rule',
}

/** Titles are level-1; nothing else uses this scale. */
const TITLE_SCALE = STYLES.title.fontScale

/**
 * `[Label](https://address)` becomes the label, with the address kept aside.
 *
 * Resolving this in the parser rather than the renderer is what keeps the fit honest: the
 * engine measures the text of a block, so the text has to be what gets printed — the
 * label — and not the syntax around it. An address it cannot make sense of is left
 * exactly as typed, brackets and all, rather than being silently emptied of a link.
 */
function resolveLabels(text) {
  const labels = []
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)/g
  let resolved = ''
  let at = 0

  for (const match of text.matchAll(pattern)) {
    const href = hrefFor(match[2])

    if (!href) continue

    resolved += text.slice(at, match.index) + match[1]
    at = match.index + match[0].length
    // The offset is the label's position in the text as it will be printed, which is what
    // lets the renderer link the right occurrence of a word that appears twice.
    labels.push({ text: match[1], href, start: resolved.length - match[1].length })
  }

  if (labels.length === 0) return { text, labels }

  return { text: resolved + text.slice(at), labels }
}

function textBlock(text, style) {
  const { text: resolved, labels } = resolveLabels(text)

  const block = {
    type: BLOCK_TYPE.text,
    text: resolved,
    fontScale: style.fontScale,
    bold: Boolean(style.bold),
    marginBottom: style.marginBottom,
    color: style.color,
    spaceBefore: style.spaceBefore,
    // A heading belongs with what it introduces: pagination reads this to avoid
    // stranding "EXPERIENCE" at the foot of a page with nothing under it.
    keepWithNext: Boolean(style.keepWithNext),
  }

  if (labels.length > 0) block.labels = labels

  return block
}

function wasTitle(block) {
  return Boolean(block) && block.type === BLOCK_TYPE.text && block.fontScale === TITLE_SCALE
}

function wasSubtitle(block) {
  return (
    Boolean(block) &&
    block.type === BLOCK_TYPE.text &&
    block.bold === false &&
    block.color === STYLES.subtitle.color &&
    block.fontScale === STYLES.subtitle.fontScale &&
    block.marginBottom === STYLES.subtitle.marginBottom
  )
}

function wasItemHeading(block) {
  return (
    Boolean(block) &&
    block.type === BLOCK_TYPE.text &&
    block.bold === true &&
    block.fontScale === STYLES.item.fontScale &&
    block.marginBottom === STYLES.item.marginBottom
  )
}

function isSectionHeading(block) {
  return (
    Boolean(block) &&
    block.type === BLOCK_TYPE.text &&
    block.bold === true &&
    block.fontScale === STYLES.section.fontScale
  )
}

/**
 * Parses markdown into a flat list of styled blocks.
 *
 * Pure and cheap: no measurement happens here, so it can run on every keystroke,
 * and it can be tested without a canvas or a DOM.
 */
export function parseMarkdown(markdown) {
  if (typeof markdown !== 'string' || markdown === '') return []

  const blocks = []

  for (const line of markdown.split('\n')) {
    if (line.trim() === '') continue

    if (line.trim() === HORIZONTAL_RULE) {
      blocks.push({ type: BLOCK_TYPE.rule, marginBottom: 16 })
      continue
    }

    // Longest prefix first: `### ` also starts with `#`, so order matters here.
    if (line.startsWith('### ')) {
      const previous = blocks[blocks.length - 1]
      const style = isSectionHeading(previous) ? STYLES.itemAfterSection : STYLES.item
      blocks.push(textBlock(line.slice(4), style))
      continue
    }

    if (line.startsWith('## ')) {
      blocks.push(textBlock(line.slice(3), STYLES.section))
      continue
    }

    if (line.startsWith('# ')) {
      blocks.push(textBlock(line.slice(2), STYLES.title))
      continue
    }

    if (line.startsWith(BULLET_PREFIX)) {
      blocks.push(textBlock(BULLET_GLYPH + line.slice(BULLET_PREFIX.length), STYLES.bullet))
      continue
    }

    const previous = blocks[blocks.length - 1]

    if (wasItemHeading(previous)) {
      blocks.push(textBlock(line, STYLES.itemMeta))
    } else if (wasTitle(previous)) {
      blocks.push(textBlock(line, STYLES.subtitle))
    } else if (wasSubtitle(previous)) {
      blocks.push(textBlock(line, STYLES.meta))
    } else {
      blocks.push(textBlock(line, STYLES.body))
    }
  }

  return blocks
}
