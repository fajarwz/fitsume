/**
 * The only button in the app, so the shell cannot drift apart piece by piece.
 */
/**
 * The secondary's hover fills, so a bare border change doesn't read as a dead button.
 */
const SECONDARY =
  'border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--muted)]'

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

/**
 * The same classes, without the element, for things that must be a link — the nav's NavLinks.
 */
export function buttonClasses({ variant = 'ghost', size = 'sm', className = '' } = {}) {
  return [
    'inline-flex items-center justify-center rounded-md font-medium transition',
    'disabled:cursor-not-allowed disabled:opacity-40',
    SIZES[size] ?? SIZES.md,
    VARIANTS[variant] ?? VARIANTS.secondary,
    className,
  ]
    .filter(Boolean)
    .join(' ')
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
    <button type={type} className={buttonClasses({ variant, size, className })} {...rest}>
      {children}
    </button>
  )
}
