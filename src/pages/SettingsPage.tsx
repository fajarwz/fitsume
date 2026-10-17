import { useNavigate } from 'react-router-dom'
import type { ComponentType } from 'react'

import TopBar from '../components/layout/TopBar.tsx'
import Button from '../components/ui/Button.tsx'
import PageHeader from '../components/ui/PageHeader.tsx'
import PageTitle from '../components/ui/PageTitle.tsx'
import Text from '../components/ui/Text.tsx'
import { MonitorIcon, MoonIcon, RestoreIcon, SunIcon } from '../components/ui/icons.tsx'
import { SAMPLES, sampleResumes } from '../lib/samples.ts'
import { missingSamples } from '../lib/stash.ts'
import { STARTER_MARKDOWN } from '../lib/starter.ts'
import { useStashContext } from '../state/StashProvider.tsx'
import { useTheme } from '../state/ThemeProvider.tsx'
import type { ThemePreference } from '../lib/theme.ts'

const THEMES: Array<[ThemePreference, string, ComponentType<{ className?: string }>]> = [
  ['light', 'Light', SunIcon],
  ['dark', 'Dark', MoonIcon],
  ['system', 'System', MonitorIcon],
]

/**
 * Settings: the two things that belong to the browser rather than to a resume.
 */
export default function SettingsPage() {
  const { library, actions } = useStashContext()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const missing = missingSamples(library, sampleResumes())
  const present = SAMPLES.length - missing.length

  return (
    <div className="flex min-h-screen flex-col text-[var(--foreground)]">
      <TopBar
        onNew={() =>
          navigate(
            `/resume/${actions.create({ name: 'New resume', markdown: STARTER_MARKDOWN }).id}`,
          )
        }
      />

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
        <PageHeader>
          <PageTitle
            title="Settings"
            subtitle="Stored in this browser. There is no account, and nothing is uploaded."
          />
        </PageHeader>

        <section className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--glass)] p-3 backdrop-blur-xl">
          <Text as="h2" variant="12-semibold">
            Display mode
          </Text>
          <Text variant="11-regular" tone="muted">
            System follows your operating system, and switches with it.
          </Text>
          <div className="flex flex-wrap gap-1">
            {THEMES.map(([id, label, Icon]) => {
              const pressed = theme === id

              return (
                <Button
                  key={id}
                  size="sm"
                  variant={pressed ? 'primary' : 'ghost'}
                  aria-pressed={pressed}
                  onClick={() => setTheme(id)}
                >
                  {/* Keyed on the theme, so the icon is remounted and replays its turn. */}
                  <Icon key={theme} className={`h-4 w-4 ${pressed ? 'theme-pop' : ''}`} />
                  {label}
                </Button>
              )
            })}
          </div>
        </section>

        <section className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--glass)] p-3 backdrop-blur-xl">
          <Text as="h2" variant="12-semibold">
            Sample resumes
          </Text>
          <Text variant="11-regular" tone="muted">
            Rename, duplicate or delete them like any other, and restore whichever you delete. Their
            contact lines link to the public record rather than to an address invented for them.
          </Text>
          <Text variant="12-regular">
            <Text as="span" variant="12-regular" mono tabular>
              {present}
            </Text>{' '}
            of{' '}
            <Text as="span" variant="12-regular" mono tabular>
              {SAMPLES.length}
            </Text>{' '}
            in your resume list
          </Text>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => actions.restoreSamples()}
              disabled={missing.length === 0}
            >
              <RestoreIcon className="h-4 w-4" />
              {missing.length === 0
                ? 'All restored'
                : `Restore ${missing.length} sample resume${missing.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}