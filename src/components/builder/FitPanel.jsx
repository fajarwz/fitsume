import Slider from '../ui/Slider.jsx'
import Text from '../ui/Text.jsx'
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
 * user, and the document grows to as many pages as their numbers need rather than
 * being cut off at the bottom of the first one.
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
  const pages = fit.pageCount ?? 1

  if (settings.autoFit) {
    return (
      <Text
        role="status"
        variant="12-regular"
        tone="muted"
        className="rounded-md bg-[var(--muted)] p-2"
      >
        Fitted at{' '}
        <Text as="span" variant="12-regular" mono tabular>
          {fit.fontSize.toFixed(1)}px
        </Text>{' '}
        with{' '}
        <Text as="span" variant="12-regular" mono tabular>
          {fit.lineHeightMultiplier.toFixed(2)}×
        </Text>{' '}
        line spacing.
        {pages > 1
          ? ` Even the smallest font size runs to ${pages} pages, so the page count stands.`
          : ''}
      </Text>
    )
  }

  if (pages > 1) {
    return (
      <Text
        role="status"
        variant="12-regular"
        tone="muted"
        className="rounded-md bg-[var(--muted)] p-2"
      >
        <Text as="span" variant="12-regular" mono tabular>
          {pages} pages
        </Text>{' '}
        at {settings.baseFontSize}px. Auto-fit would bring it back to one.
      </Text>
    )
  }

  return (
    <Text
      role="status"
      variant="12-regular"
      tone="muted"
      className="rounded-md bg-[var(--muted)] p-2"
    >
      One page at {settings.baseFontSize}px, with room to spare — auto-fit would use the space.
    </Text>
  )
}
