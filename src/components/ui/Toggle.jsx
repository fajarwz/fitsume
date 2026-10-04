import Text from './Text.jsx'
import { CheckIcon } from './icons.jsx'

const TOGGLE_STYLE = {
  // Green (not the accent) so it reads as "on/enabled, not the app's primary-action button".
  on: 'border-transparent bg-[var(--positive)] text-[var(--positive-foreground)] hover:bg-[var(--positive-hover)]',
  off: 'border-[var(--border)] bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
}

/**
 * A button with aria-pressed, not a sliding switch — these options are one-tap choices.
 */
export default function Toggle({
  label,
  checked,
  disabled = false,
  hint,
  onChange,
  className = '',
}) {
  return (
    <div className={disabled ? 'opacity-60' : undefined}>
      <button
        type="button"
        aria-pressed={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-3 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
          checked ? TOGGLE_STYLE.on : TOGGLE_STYLE.off
        } ${className}`}
      >
        {checked ? <CheckIcon className="h-3.5 w-3.5" /> : null}
        {label}
      </button>
      {hint ? (
        <Text variant="11-regular" tone="muted" className="mt-1.5">
          {hint}
        </Text>
      ) : null}
    </div>
  )
}
