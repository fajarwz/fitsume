import Text from './Text.jsx'
import { CheckIcon } from './icons.jsx'

/** The look a toggled control should share whether it is on or off. */
const TOGGLE_STYLE = {
  // Green, not the accent: the accent is the app's one "do the action" button (Export,
  // New), so a toggle that filled accent read as a primary action instead of a switch.
  // Green is the token for "on/enabled", so it is immediately not a button and clearly
  // a toggle that is active.
  on: 'border-transparent bg-[var(--positive)] text-[var(--positive-foreground)] hover:bg-[var(--positive-hover)]',
  off: 'border-[var(--border)] bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
}

/**
 * A checkbox as a press button rather than a tick box: active turns the whole button
 * the accent colour, and a second click drops the background so it reads plain again.
 *
 * It is a button with `aria-pressed`, not a sliding switch — a switch implies on/off
 * states, but these options (auto-fit, replacement) are choices, and the colour toggle
 * reads as one without the switch's mechanical feel.
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
