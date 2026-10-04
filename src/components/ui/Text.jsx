/**
 * Text: the type scale, named by the size and weight it sets.
 *
 * The shell had nine sizes in it — 10px, 11px, 12px, 14px, 16px, with fractional line
 * heights like 17.875px and 16.5px — and the most common of them was plain 16px inherited
 * by elements that never said anything at all. Nothing was wrong individually; there was
 * just no scale, so every panel invented its own.
 *
 * So a variant is a size and a weight, spelled out: `14-regular`, `12-medium`,
 * `16-semibold`. Named that way on purpose — a name like "caption" tells you nothing about
 * what you get, and when two of them are next to each other the difference should be
 * readable in the code, not inferred.
 *
 *   <Text variant="12-medium">Auto-fit</Text>
 *   <Text as="h1" variant="18-semibold" className="tracking-tight">Library</Text>
 *   <Text variant="12-regular" tone="muted">Stored in this browser.</Text>
 *
 * Line heights come with the size, because a size without one is where the fractional
 * numbers came from.
 *
 * The resume itself is not these: the sheet is a document with its own typography, set by
 * the fit engine, and it does not care what the app's UI does.
 */
const LINE_HEIGHTS = {
  11: '14px',
  12: '16px',
  14: '20px',
  16: '24px',
  18: '28px',
}

const SIZES = [11, 12, 14, 16, 18]

const WEIGHTS = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
}

const TONES = {
  default: 'text-[var(--foreground)]',
  muted: 'text-[var(--muted-foreground)]',
  faint: 'text-[var(--ink-faint)]',
  negative: 'text-[var(--negative)]',
}

/** A multiple of the size, for the places prose wants more air than the scale gives. */
const LEADING = {
  tight: 1.25,
  relaxed: 1.6,
}

export const TEXT_VARIANTS = SIZES.flatMap((size) =>
  Object.keys(WEIGHTS).map((weight) => `${size}-${weight}`),
)

export default function Text({
  as: Tag = 'p',
  variant = '14-regular',
  tone = 'default',
  leading = 'normal',
  mono = false,
  tabular = false,
  className = '',
  children,
  ...rest
}) {
  const [size, weight = 'regular'] = String(variant).split('-')
  const sizePx = SIZES.includes(Number(size)) ? Number(size) : 14
  const weightPx = WEIGHTS[weight] ?? WEIGHTS.regular
  const multiplier = LEADING[leading]

  return (
    <Tag
      style={{
        fontSize: `${sizePx}px`,
        lineHeight: multiplier ? `${multiplier}em` : LINE_HEIGHTS[sizePx],
        fontWeight: weightPx,
      }}
      /* Inline styles for the three axes that must not drift, and Tailwind for the rest
         (tone, family, the caller's own classes), so a caller can still override a colour
         without fighting specificity. */
      className={[
        TONES[tone] ?? TONES.default,
        mono ? 'font-mono' : '',
        tabular ? 'tabular-nums' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </Tag>
  )
}
