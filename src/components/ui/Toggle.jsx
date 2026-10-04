import { useId } from 'react'

import Text from './Text.jsx'

/** A checkbox with a label and an explanation, used for auto-fit. */
export default function Toggle({ label, checked, disabled = false, hint, onChange }) {
  const id = useId()

  return (
    <div className={disabled ? 'opacity-50' : undefined}>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)]"
        />
        <Text as="label" htmlFor={id} variant="14-medium">
          {label}
        </Text>
      </div>
      {hint ? (
        <Text variant="11-regular" tone="muted" className="mt-1">
          {hint}
        </Text>
      ) : null}
    </div>
  )
}
