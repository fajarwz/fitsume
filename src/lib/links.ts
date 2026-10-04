/**
 * Finding the links in a line of text.
 *
 * A resume header is where contact details live, and they are the one part of the
 * document a reader might actually want to click — in the preview and in the exported
 * PDF, where an address that is not a link is an address someone has to retype.
 *
 * There are two ways a link gets there. One is written out and recognised by what it
 * looks like: an email address, a URL, or a bare domain on the short list of endings
 * people put on a resume. The other is `[Label](https://…)`, which the parser has already
 * resolved into its label plus the address it hides, so it arrives here as a label to
 * find in the line.
 *
 * Both come back in one shape: a match holding a start, an end, and where it goes. The
 * renderer slices the line on those and draws the pieces. A match never changes the text,
 * only which parts of it are clickable — so the characters drawn are the characters
 * measured, which is the property the whole fit rests on.
 */
const TLD = 'com|org|net|io|dev|id|co|me|ai|app|xyz|info|edu|gov|ac|sch'

const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/
const URL = /^https?:\/\/\S+$/i
const DOMAIN = new RegExp(`^(?:www\\.)?(?:[A-Za-z0-9-]+\\.)+(?:${TLD})(?:\\/\\S*)?$`, 'i')
const ADDRESS = new RegExp(
  `(?<![\\w@./-])(?:[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)*\\.[A-Za-z]{2,}|https?:\\/\\/\\S+|[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)*\\.(?:${TLD})(?:\\/\\S*)?)(?![\\w@./-])`,
  'gi',
)

/** Sentence punctuation belongs to the sentence, not to the address. */
const TRAILING_PUNCTUATION = /[),.;:!?]+$/

/** A found run: where it sits in the text and where it should go. */
export interface Match {
  start: number
  end: number
  href: string
}

/** A segment the renderer draws, marked clickable or not. */
export interface Segment {
  text: string
  href: string | null
}

/** A label a block carries, as supplied by the parser. */
export interface LinkLabel {
  text: string
  href: string
  start?: number
}

export function hrefFor(token: unknown): string | null {
  if (typeof token !== 'string' || token === '') return null
  if (EMAIL.test(token)) return `mailto:${token}`
  if (URL.test(token)) return token
  if (DOMAIN.test(token)) return `https://${token}`

  return null
}

/** Addresses written out in the line, as matches. */
export function findAddresses(text: unknown): Match[] {
  if (typeof text !== 'string' || text === '') return []

  const matches: Match[] = []

  for (const match of text.matchAll(new RegExp(ADDRESS.source, ADDRESS.flags))) {
    const token = match[0].replace(TRAILING_PUNCTUATION, '')
    const href = hrefFor(token)

    if (!href) continue

    matches.push({ start: match.index!, end: match.index! + token.length, href })
  }

  return matches
}

/**
 * The labels a block carries, as matches.
 *
 * `wholeText` is the block's printed text. When the line being rendered is the whole block
 * — a header, a contact line, a bullet, which is most of a resume — the parser's own
 * offsets are still true here, and using them links the right occurrence of a word that
 * appears on the line twice. On a line the breaker carved out of a wrapped block those
 * offsets have drifted, so the label is found by its text instead.
 *
 * A label that cannot be found is one the line breaker split in two, and there is nothing
 * to do about that here: it renders as the plain text it is and only the click is lost.
 * That is why the button which writes these offers to use a selected word as the label
 * rather than inviting a whole sentence of one.
 */
export function findLabels(
  text: unknown,
  labels?: LinkLabel[] | null | undefined,
  wholeText?: unknown,
): Match[] {
  if (typeof text !== 'string' || text === '') return []

  const matches: Match[] = []

  for (const label of labels ?? []) {
    const exact = wholeText === text && typeof label.start === 'number' ? label.start : -1
    const at = exact !== -1 ? exact : text.indexOf(label.text)

    if (at === -1 || text.slice(at, at + label.text.length) !== label.text) continue

    matches.push({ start: at, end: at + label.text.length, href: label.href })
  }

  return matches
}

/** Cuts a line into runs on the matches, earliest first, overlapping losers dropped. */
export function segmentsFrom(text: unknown, ...groups: Match[][]): Segment[] {
  if (typeof text !== 'string' || text === '') return []

  const matches = groups.flat().sort((left, right) => left.start - right.start)
  const segments: Segment[] = []
  let at = 0

  for (const match of matches) {
    if (match.start < at) continue

    if (match.start > at) segments.push({ text: text.slice(at, match.start), href: null })

    segments.push({ text: text.slice(match.start, match.end), href: match.href })
    at = match.end
  }

  if (at < text.length) segments.push({ text: text.slice(at), href: null })

  return segments
}

/** A line whose only links are addresses written out in it. */
export function splitLinks(text: unknown): Segment[] {
  return segmentsFrom(text, findAddresses(text))
}

/** True when the line has at least one run that should be clickable. */
export function hasLink(segments: Segment[]): boolean {
  return segments.some((segment) => segment.href !== null)
}