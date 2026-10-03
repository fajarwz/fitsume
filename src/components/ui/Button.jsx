const VARIANTS = {
  primary:
    'bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90 border border-transparent',
  subtle:
    'bg-transparent text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--card)]',
  ghost:
    'bg-transparent text-[var(--muted-foreground)] border border-transparent hover:text-[var(--foreground)] hover:bg-[var(--card)]',
  danger: 'bg-transparent text-[var(--negative)] border border-[var(--border)] hover:opacity-80',
}

const SIZES = {
  sm: 'h-7 px-2 text-xs gap-1',
  md: 'h-9 px-3 text-sm gap-1.5',
}

/** The only button in the app, so the shell cannot drift apart piece by piece. */
export default function Button({
  variant = 'subtle',
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
        VARIANTS[variant] ?? VARIANTS.subtle,
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
