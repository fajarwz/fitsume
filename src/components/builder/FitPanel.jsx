import Slider from '../ui/Slider.jsx'
import Toggle from '../ui/Toggle.jsx'
import {
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  LINE_HEIGHT_MAX,
  LINE_HEIGHT_MIN,
  MAX_PADDING,
  MIN_PADDING,
} from '../../lib/page.js'
import { SPACING_BOUNDS } from '../../lib/settings.js'

/**
 * The fit controls.
 *
 * Auto-fit is the default and the headline feature, so everything it overrides is
 * disabled while it is on — a slider that silently does nothing is worse than a
 * slider that is visibly unavailable. Turning it off hands the numbers back to the
 * user, and if their numbers do not fit, the readout says so instead of quietly
 * shrinking their document.
 */
export default function FitPanel({ settings, fit, onChange }) {
  const set = (patch) => onChange(patch)
  const setSpacing = (key, value) => set({ spacing: { ...settings.spacing, [key]: value } })
  const auto = settings.autoFit

  return (
    <div className="flex flex-col gap-3">
      <Toggle
        label="Auto-fit to one page"
        checked={auto}
        onChange={(value) => set({ autoFit: value })}
        hint="Finds the largest font size and line spacing that still fits."
      />

      <Rollup fit={fit} settings={settings} />

      <Slider
        label="Font size"
        min={FONT_SIZE_MIN}
        max={FONT_SIZE_MAX}
        step={0.5}
        decimals={1}
        suffix="px"
        value={settings.baseFontSize}
        disabled={auto}
        onChange={(value) => set({ baseFontSize: value })}
        hint={auto ? 'Auto-fit is choosing this; the slider is its ceiling.' : undefined}
      />

      <Slider
        label="Line spacing"
        min={LINE_HEIGHT_MIN}
        max={LINE_HEIGHT_MAX}
        step={0.05}
        decimals={2}
        suffix="×"
        value={settings.lineHeightMultiplier}
        disabled={auto}
        onChange={(value) => set({ lineHeightMultiplier: value })}
      />

      <Slider
        label="Page margin"
        min={MIN_PADDING}
        max={MAX_PADDING}
        suffix="px"
        value={settings.padding}
        onChange={(value) => set({ padding: value })}
      />

      <Slider
        label="Section spacing"
        min={SPACING_BOUNDS.section[0]}
        max={SPACING_BOUNDS.section[1]}
        suffix="px"
        value={settings.spacing.section}
        onChange={(value) => setSpacing('section', value)}
      />

      <Slider
        label="Item spacing"
        min={SPACING_BOUNDS.item[0]}
        max={SPACING_BOUNDS.item[1]}
        suffix="px"
        value={settings.spacing.item}
        onChange={(value) => setSpacing('item', value)}
      />

      <Slider
        label="Separator spacing"
        min={SPACING_BOUNDS.separator[0]}
        max={SPACING_BOUNDS.separator[1]}
        suffix="px"
        value={settings.spacing.separator}
        onChange={(value) => setSpacing('separator', value)}
      />
    </div>
  )
}

function Rollup({ fit, settings }) {
  if (settings.autoFit) {
    return (
      <p className="rounded-md bg-[var(--background)] p-2 text-xs text-[var(--muted-foreground)]">
        Fitted at{' '}
        <span className="font-mono tabular-nums text-[var(--foreground)]">
          {fit.fontSize.toFixed(1)}px
        </span>{' '}
        with{' '}
        <span className="font-mono tabular-nums text-[var(--foreground)]">
          {fit.lineHeightMultiplier.toFixed(2)}×
        </span>{' '}
        line spacing.
      </p>
    )
  }

  if (fit.overflow > 0) {
    return (
      <p
        role="status"
        className="rounded-md p-2 text-xs"
        style={{ background: 'rgba(185,28,28,0.12)', color: 'var(--negative)' }}
      >
        {fit.overflow}px past the bottom of the page at {settings.baseFontSize}px. Turn auto-fit back
        on, lower the font size, or cut something.
      </p>
    )
  }

  return (
    <p role="status" className="rounded-md bg-[var(--background)] p-2 text-xs text-[var(--muted-foreground)]">
      Fits with room to spare at {settings.baseFontSize}px — auto-fit would use the space.
    </p>
  )
}
