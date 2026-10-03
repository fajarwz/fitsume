/**
 * The only button in the app, so the shell cannot drift apart piece by piece.
 *
 * Three variants, in Vercel's spirit: one near-black button for the single primary
 * action on a screen, a white button with a hairline border for everything else, and a
 * text-only one for actions that should not compete for attention. The primary one is
 * the only place the near-black accent is used at size, which is what makes it read as
 * the primary action.
 */
const SECONDARY =
  'border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--border-strong)]'

const VARIANTS = {
  primary:
    'border border-transparent bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]',
  secondary: SECONDARY,
  ghost:
    'border border-transparent bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
  danger:
    'border border-[var(--border)] bg-transparent text-[var(--negative)] hover:border-[var(--negative)]',
}

/** 40px and 32px, rather than whatever a thumb happened to land on. */
const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center rounded-md font-medium transition',
        'disabled:cursor-not-allowed disabled:opacity-40',
        SIZES[size] ?? SIZES.md,
        VARIANTS[variant] ?? VARIANTS.secondary,
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
