import { useId } from 'react'

/** Label, control, and the value it is currently at — the settings panel is made of these. */
export default function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  decimals = 0,
  disabled = false,
  onChange,
  hint,
}) {
  const id = useId()
  const shown = Number.isFinite(value) ? value.toFixed(decimals) : '—'

  return (
    <div className={disabled ? 'opacity-50' : undefined}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-[var(--muted-foreground)]">
          {label}
        </label>
        <span className="font-mono text-xs tabular-nums text-[var(--foreground)]">
          {shown}
          {suffix}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--border)] accent-[var(--accent)]"
      />
      {hint ? <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">{hint}</p> : null}
    </div>
  )
}
