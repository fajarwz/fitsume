/**
 * Finding the links in a line of text.
 *
 * A resume header is where contact details live, and they are the one part of the
 * document a reader might actually want to click — in the preview and in the exported
 * PDF, where an address that is not a link is an address someone has to retype.
 *
 * The dialect has no link syntax on purpose (this is a resume, not a blogging
 * platform), so links are recognised by what they look like: an email address, a URL,
 * or a bare domain on the short list of endings people put on a resume. That keeps the
 * document readable as plain text, which is also what the fit engine measures.
 *
 * The result is the line split into runs, each either plain text or a link. Splitting
 * only rearranges characters that were already there: joined back up, the runs are the
 * original string, which is the property that keeps the rendered line and the measured
 * line the same length.
 */
const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/
const URL = /^https?:\/\/\S+$/i
const DOMAIN =
  /^(?:www\.)?(?:[A-Za-z0-9-]+\.)+(?:com|org|net|io|dev|id|co|me|ai|app|xyz|info|edu|gov|ac|sch)(?:\/\S*)?$/i

/** Trailing sentence punctuation belongs to the sentence, not to the address. */
const TRAILING_PUNCTUATION = /[),.;:!?]+$/

export function hrefFor(token) {
  if (typeof token !== 'string' || token === '') return null
  if (EMAIL.test(token)) return `mailto:${token}`
  if (URL.test(token)) return token
  if (DOMAIN.test(token)) return `https://${token}`

  return null
}

export function splitLinks(text) {
  if (typeof text !== 'string' || text === '') return []

  const segments = []
  let plain = ''

  const flushPlain = () => {
    if (plain !== '') segments.push({ text: plain, href: null })

    plain = ''
  }

  // Whitespace runs are kept as tokens so nothing is lost or invented on the way
  // through: the separators in "City · you@example.com" stay with the plain text.
  for (const token of text.split(/(\s+)/)) {
    if (token === '') continue

    if (/^\s+$/.test(token)) {
      plain += token
      continue
    }

    const address = token.replace(TRAILING_PUNCTUATION, '')
    const href = hrefFor(address)

    if (!href) {
      plain += token
      continue
    }

    flushPlain()
    segments.push({ text: address, href })
    plain = token.slice(address.length)
  }

  flushPlain()

  return segments
}

/** True when the line has at least one run that should be clickable. */
export function hasLink(segments) {
  return segments.some((segment) => segment.href !== null)
}
