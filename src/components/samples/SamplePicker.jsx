import { useState } from 'react'

import Button from '../ui/Button.jsx'
import Empty from '../ui/Empty.jsx'
import Modal from '../ui/Modal.jsx'
import { SAMPLE_CATEGORIES, SAMPLES } from '../../lib/samples.js'

const LENGTH_LABEL = { minimal: 'Short', normal: 'One page', dense: 'Dense', long: 'Long' }

/**
 * Samples, as samples.
 *
 * The original replaced whatever was in the editor with a stranger's resume the
 * moment you pressed a button. Here a sample is a starting point you choose
 * deliberately, and replacing a document you have written asks first.
 */
export default function SamplePicker({ onUseSample, hasContent = false, onClose }) {
  const [pending, setPending] = useState(null)
  const [category, setCategory] = useState('all')

  const shown = category === 'all' ? SAMPLES : SAMPLES.filter((entry) => entry.category === category)

  const choose = (sample) => {
    if (hasContent) {
      setPending(sample)

      return
    }

    onUseSample(sample)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1">
        {[{ id: 'all', label: 'All' }, ...SAMPLE_CATEGORIES].map((entry) => (
          <Button
            key={entry.id}
            size="sm"
            variant={category === entry.id ? 'primary' : 'ghost'}
            onClick={() => setCategory(entry.id)}
          >
            {entry.label}
          </Button>
        ))}
        {onClose ? (
          <Button size="sm" variant="ghost" className="ml-auto" onClick={onClose}>
            Close
          </Button>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {shown.map((sample) => (
          <div
            key={sample.id}
            className="flex flex-col gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] p-3"
          >
            <div>
              <h3 className="text-xs font-semibold">{sample.label}</h3>
              <p className="mt-0.5 font-mono text-[11px] text-[var(--muted-foreground)]">
                {sample.markdown.split('\n')[1] ?? ''}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[var(--muted-foreground)]">
              <span className="rounded-full border border-[var(--border)] px-1.5 py-0.5">
                {LENGTH_LABEL[sample.length] ?? sample.length}
              </span>
              <span>{sample.category}</span>
            </div>
            <Button
              size="sm"
              variant="primary"
              className="self-start"
              onClick={() => choose(sample)}
            >
              Use this
            </Button>
          </div>
        ))}
      </div>

      <Modal
        open={pending !== null}
        title="Replace what you have written?"
        description={`The editor currently holds a document. Loading "${pending?.label ?? ''}" replaces it — your other resumes are untouched.`}
        confirmLabel="Replace"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) onUseSample(pending)

          setPending(null)
        }}
      />
    </div>
  )
}

/** The first run: an empty library, a blank page, or a sample to make the point. */
export function FirstRunChooser({ onStartBlank, onUseSample }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <Empty
        title="No resumes yet"
        description="Write in markdown and the preview picks the largest font size that still fills one A4 page. Everything is stored in this browser — nothing is uploaded, and there is no account."
      >
        <div className="flex justify-center gap-2">
          <Button variant="primary" onClick={onStartBlank}>
            Start from scratch
          </Button>
        </div>
      </Empty>

      <p className="text-center text-xs text-[var(--muted-foreground)]">
        Or begin from a sample resume, and edit it into your own:
      </p>

      <SamplePicker onUseSample={onUseSample} hasContent={false} />
    </div>
  )
}
