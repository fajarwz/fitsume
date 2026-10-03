import { useId } from 'react'

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
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
      </div>
      {hint ? <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">{hint}</p> : null}
    </div>
  )
}
