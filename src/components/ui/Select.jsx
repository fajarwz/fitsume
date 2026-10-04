import { Chevron } from './icons.jsx'

/**
 * The forms plugin bakes a hardcoded-grey chevron into <select>; strip it (appearance-none,
 * bg-none) and draw an element that takes the theme, sized to match Button.
 */
const SIZES = {
  sm: { field: 'h-8 pl-2.5 pr-8 text-xs', icon: 'right-2 h-3.5 w-3.5' },
  md: { field: 'h-10 pl-3 pr-9 text-sm', icon: 'right-2.5 h-4 w-4' },
}

export default function Select({ size = 'md', className = '', children, ...rest }) {
  const style = SIZES[size] ?? SIZES.md

  return (
    <span className={['relative inline-flex items-center', className].join(' ')}>
      <select
        /* bg-none clears the forms plugin's baked-in chevron. */
        className={[
          'w-full appearance-none truncate rounded-md border border-[var(--border)] bg-[var(--card)] bg-none',
          'text-[var(--foreground)] outline-none transition hover:border-[var(--border-strong)]',
          style.field,
        ].join(' ')}
        {...rest}
      >
        {children}
      </select>

      <Chevron
        className={['pointer-events-none absolute text-[var(--muted-foreground)]', style.icon].join(
          ' ',
        )}
      />
    </span>
  )
}
