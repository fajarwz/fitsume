import { useId } from 'react'

import Text from './Text.jsx'

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
        <Text as="label" htmlFor={id} variant="12-medium" tone="muted">
          {label}
        </Text>
        <Text as="span" variant="12-regular" mono tabular>
          {shown}
          {suffix}
        </Text>
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
      {hint ? (
        <Text variant="11-regular" tone="muted" className="mt-1">
          {hint}
        </Text>
      ) : null}
    </div>
  )
}
