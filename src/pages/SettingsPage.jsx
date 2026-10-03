import { useNavigate } from 'react-router-dom'

import TopBar from '../components/layout/TopBar.jsx'
import Button from '../components/ui/Button.jsx'
import { SAMPLES, sampleResumes } from '../lib/samples.js'
import { missingSamples } from '../lib/stash.js'
import { useStashContext } from '../state/StashProvider.jsx'
import { useTheme } from '../state/ThemeProvider.jsx'

const THEMES = [
  ['light', 'Light'],
  ['dark', 'Dark'],
  ['system', 'System'],
]

/**
 * Settings: the two things that belong to the browser rather than to a resume.
 *
 * Display mode, because it is a property of this screen and not of any document. And
 * the sample resumes, because they are seeded into the library now: this is where they
 * are brought back if they were deleted, along with what each of them is built from.
 */
export default function SettingsPage() {
  const { library, actions } = useStashContext()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const missing = missingSamples(library, sampleResumes())
  const present = SAMPLES.length - missing.length

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <TopBar onNew={() => navigate(`/resume/${actions.create({ name: 'New resume' }).id}`)} />

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Stored in this browser. There is no account, and nothing is uploaded.
          </p>
        </div>

        <section className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
          <h2 className="text-xs font-semibold">Display mode</h2>
          <p className="text-[11px] text-[var(--muted-foreground)]">
            System follows your operating system, and switches with it.
          </p>
          <div className="flex flex-wrap gap-1">
            {THEMES.map(([id, label]) => (
              <Button
                key={id}
                size="sm"
                variant={theme === id ? 'primary' : 'ghost'}
                aria-pressed={theme === id}
                onClick={() => setTheme(id)}
              >
                {label}
              </Button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
          <h2 className="text-xs font-semibold">Sample resumes</h2>
          <p className="text-[11px] text-[var(--muted-foreground)]">
            Rename, duplicate or delete them like any other, and restore whichever you delete.
          </p>
          <p className="text-xs">
            <span className="font-mono tabular-nums">{present}</span> of{' '}
            <span className="font-mono tabular-nums">{SAMPLES.length}</span> in your library
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => actions.restoreSamples()}
              disabled={missing.length === 0}
            >
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
