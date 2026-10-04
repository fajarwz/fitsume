import { Chevron } from './icons.jsx'

/**
 * The one select in the app, so a dropdown cannot drift apart from a button.
 *
 * It exists because the alternative was invisible damage: the forms plugin styles every
 * `<select>` with a chevron baked into a background image — a hardcoded grey that knows
 * nothing about the theme — plus padding reserved for it, which every caller then had to
 * hand-tune with `pr-9`. Here the native control is stripped bare (`appearance-none`) and
 * the arrow is an element, so it takes the muted colour from the tokens and can sit at the
 * same height as a Button.
 *
 * The sizes match Button's, on purpose: 32px and 40px, so a select and a button in the same
 * row are the same height.
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
        /* bg-none clears the background-image the forms plugin draws its chevron with;
           the rest is the same border, radius and background as a Button. */
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
