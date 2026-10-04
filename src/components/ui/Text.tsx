import type { ComponentPropsWithRef, ElementType, ReactNode } from 'react'

/**
 * Type scale: a variant is its size and weight spelled out ("14-regular"), with the line
 * height riding along so fractional values can't creep back.
 */
const LINE_HEIGHTS: Record<number, string> = {
  11: '14px',
  12: '16px',
  14: '20px',
  16: '24px',
  18: '28px',
}

const SIZES = [11, 12, 14, 16, 18]

const WEIGHTS: Record<string, number> = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
}

const TONES: Record<string, string> = {
  default: 'text-[var(--foreground)]',
  muted: 'text-[var(--muted-foreground)]',
  faint: 'text-[var(--ink-faint)]',
  negative: 'text-[var(--negative)]',
}

const LEADING: Record<string, number> = {
  tight: 1.25,
  relaxed: 1.6,
}

type TextOwnProps = {
  as?: ElementType
  variant?: string
  tone?: string
  leading?: string
  mono?: boolean
  tabular?: boolean
  className?: string
  children?: ReactNode
}

export type TextProps<T extends ElementType> = TextOwnProps &
  Omit<ComponentPropsWithRef<T>, keyof TextOwnProps | 'as'>

export const TEXT_VARIANTS = SIZES.flatMap((size) =>
  Object.keys(WEIGHTS).map((weight) => `${size}-${weight}`),
)

export default function Text<T extends ElementType>({
  as = 'p',
  variant = '14-regular',
  tone = 'default',
  leading = 'normal',
  mono = false,
  tabular = false,
  className = '',
  children,
  ...rest
}: TextProps<T>) {
  const Tag = (as ?? 'p') as ElementType
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
      /* Inline for the axes that must not drift; Tailwind for the rest so callers can still override. */
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
