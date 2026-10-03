import { useNavigate } from 'react-router-dom'

import TopBar from '../components/layout/TopBar.jsx'
import SamplePicker from '../components/samples/SamplePicker.jsx'
import { useStashContext } from '../state/StashProvider.jsx'

/**
 * The samples gallery, as a page rather than a dialog.
 *
 * It is a screen of content you browse, compare and choose from, so it gets a URL
 * of its own: you can go back to it, link to it, and reload it. Choosing one makes
 * a new resume and opens it — it never overwrites the document you were working on,
 * which is the failure the original had.
 */
export default function SamplesPage() {
  const { actions } = useStashContext()
  const navigate = useNavigate()

  const use = (sample) => {
    const resume = actions.create({ name: sample.label, markdown: sample.markdown })

    navigate(`/resume/${resume.id}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <TopBar
        onNew={() => navigate(`/resume/${actions.create({ name: 'New resume' }).id}`)}
      />

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Sample resumes</h1>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Real people, built from the public record of their work - short, dense, packed, and
            everything in between. Pick one and edit it into your own; it opens as a new resume,
            so nothing you have already written is touched.
          </p>
        </div>

        <SamplePicker onUseSample={use} />
      </main>
    </div>
  )
}
