import { hrefFor } from './links.ts'

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
 *
 * A line's style is decided here, once, and carried on the block as its `kind`.
 * Nothing downstream asks what a block *looks* like: colours are shared on purpose
 * (the summary and a bullet read in the same ink), and a style inferred from its own
 * colour would silently rewrite the dialect the day two of them matched.
 */

export interface BlockLabel {
  text: string
  href: string
  start: number
}

/**
 * What a line is, structurally — the parser's own mark, set where the style is chosen.
 */
export type BlockKind =
  | 'title'
  | 'subtitle'
  | 'meta'
  | 'itemMeta'
  | 'section'
  | 'item'
  | 'bullet'
  | 'body'

export interface TextBlock {
  type: 'text'
  kind: BlockKind
  text: string
  fontScale: number
  bold: boolean
  marginBottom: number
  color: string
  spaceBefore?: 'section' | 'item'
  keepWithNext?: boolean
  labels?: BlockLabel[]
}

export interface RuleBlock {
  type: 'rule'
  marginBottom: number
}

export type Block = TextBlock | RuleBlock

interface BlockStyle {
  kind: BlockKind
  fontScale: number
  bold: boolean
  marginBottom: number
  color: string
  spaceBefore?: 'section' | 'item'
  keepWithNext?: boolean
}

const STYLES: Record<string, BlockStyle> = {
  title: {
    kind: 'title',
    fontScale: 1.5,
    bold: true,
    marginBottom: 4,
    color: 'ink',
    keepWithNext: true,
  },
  subtitle: {
    kind: 'subtitle',
    fontScale: 1,
    bold: false,
    marginBottom: 6,
    color: 'inkMuted',
    keepWithNext: true,
  },
  meta: { kind: 'meta', fontScale: 0.8, bold: false, marginBottom: 16, color: 'inkFaint' },
  itemMeta: { kind: 'itemMeta', fontScale: 0.8, bold: false, marginBottom: 6, color: 'inkFaint' },
  section: {
    kind: 'section',
    fontScale: 0.85,
    bold: true,
    marginBottom: 3,
    color: 'inkFaint',
    spaceBefore: 'section',
    keepWithNext: true,
  },
  item: {
    kind: 'item',
    fontScale: 1,
    bold: true,
    marginBottom: 2,
    color: 'ink',
    spaceBefore: 'item',
    keepWithNext: true,
  },
  // The same item again, minus its own gap: the section heading above it already
  // carries one, and paying for both would leave a hole under every first job.
  itemAfterSection: {
    kind: 'item',
    fontScale: 1,
    bold: true,
    marginBottom: 2,
    color: 'ink',
    keepWithNext: true,
  },
  bullet: { kind: 'bullet', fontScale: 1, bold: false, marginBottom: 3, color: 'inkMuted' },
  // Plain prose: the summary under the header, the description under a degree, the
  // line after a section that is all one sentence. Deliberately the same ink as a
  // bullet — a resume's own sentences sit at one weight, and only the headings and
  // the metadata lines step out of it. `ink` here instead made a summary as black as
  // the job titles around it.
  body: { kind: 'body', fontScale: 1, bold: false, marginBottom: 6, color: 'inkMuted' },
}

const BULLET_PREFIX = '- '
const BULLET_GLYPH = '\u2022 '
const HORIZONTAL_RULE = '---'

export const BLOCK_TYPE = {
  text: 'text',
  rule: 'rule',
} as const

/**
 * `[Label](https://address)` becomes the label, with the address kept aside.
 *
 * Resolving this in the parser rather than the renderer is what keeps the fit honest: the
 * engine measures the text of a block, so the text has to be what gets printed — the
 * label — and not the syntax around it. An address it cannot make sense of is left
 * exactly as typed, brackets and all, rather than being silently emptied of a link.
 */
function resolveLabels(text: string): { text: string; labels: BlockLabel[] } {
  const labels: BlockLabel[] = []
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

function textBlock(text: string, style: BlockStyle): TextBlock {
  const { text: resolved, labels } = resolveLabels(text)

  const block: TextBlock = {
    type: BLOCK_TYPE.text,
    kind: style.kind,
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

/**
 * Whether a block is text of a given kind.
 *
 * The block type is checked as well as the kind, because a rule block has no kind and
 * a rule never introduces anything: `kind` is the only thing these predicates read, so
 * a style's colour, size and margins are free to change without rewriting the dialect.
 */
function hasKind(block: Block | undefined, kind: BlockKind): boolean {
  return block !== undefined && block.type === BLOCK_TYPE.text && block.kind === kind
}

/**
 * Parses markdown into a flat list of styled blocks.
 *
 * Pure and cheap: no measurement happens here, so it can run on every keystroke,
 * and it can be tested without a canvas or a DOM.
 */
export function parseMarkdown(markdown: unknown): Block[] {
  if (typeof markdown !== 'string' || markdown === '') return []

  const blocks: Block[] = []

  for (const line of markdown.split('\n')) {
    if (line.trim() === '') continue

    if (line.trim() === HORIZONTAL_RULE) {
      blocks.push({ type: BLOCK_TYPE.rule, marginBottom: 16 })
      continue
    }

    // Longest prefix first: `### ` also starts with `#`, so order matters here.
    if (line.startsWith('### ')) {
      const previous = blocks[blocks.length - 1]
      // The first item under a section already has the section's gap above it.
      const style = hasKind(previous, 'section') ? STYLES.itemAfterSection : STYLES.item
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

    // The three header rules: the line under the name is the role, the line under that
    // is the contact line, and the line under a job title is its dates. Kind, not look,
    // is what makes each of them identifiable.
    if (hasKind(previous, 'item')) {
      blocks.push(textBlock(line, STYLES.itemMeta))
    } else if (hasKind(previous, 'title')) {
      blocks.push(textBlock(line, STYLES.subtitle))
    } else if (hasKind(previous, 'subtitle')) {
      blocks.push(textBlock(line, STYLES.meta))
    } else {
      blocks.push(textBlock(line, STYLES.body))
    }
  }

  return blocks
}