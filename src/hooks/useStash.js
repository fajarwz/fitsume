import { useEffect, useMemo, useRef, useState } from 'react'

import {
  activeResume as pickActive,
  addResume,
  createResume,
  duplicateResume,
  loadLibrary,
  removeManyResume,
  removeResume,
  renameResume,
  restoreSamples as restoreSampleResumes,
  saveLibrary,
  seedLibrary,
  setActiveResume,
  sortResumesByRecency,
  updateResume,
} from '../lib/stash.js'
import { sampleResumes } from '../lib/samples.js'

/**
 * The resume library, in React.
 *
 * Writes are debounced so that typing does not hit localStorage on every
 * keystroke, and flushed on unmount so a debounced write is never simply lost.
 *
 * The hook owns no storage policy: it is handed a storage object, which is how the
 * tests drive it and how the app falls back to memory.
 */
const SAVE_DELAY = 350

export function useStash(storage) {
  // Loading and seeding are one step, because the first frame should already show the
  // sample resumes: an empty library that fills in a moment later is a worse first
  // impression than either state on its own.
  const [initial] = useState(() => {
    const loaded = loadLibrary(storage)
    const library = seedLibrary(loaded.library, sampleResumes())

    return { ...loaded, library, seeded: library !== loaded.library }
  })
  const [library, setLibrary] = useState(initial.library)
  const [status] = useState(initial.status)
  const [saveResult, setSaveResult] = useState({ saved: true })

  // Mirrors for the deferred writes. A write that is still pending when the screen
  // goes away must not vanish, so the latest library has to be reachable from a
  // cleanup, where component state is not.
  const latest = useRef(initial.library)
  const dirty = useRef(false)
  // Seeding is an unsaved change, so it must not be skipped along with the first render.
  const skipFirst = useRef(!initial.seeded)

  useEffect(() => {
    latest.current = library
    dirty.current = true
  }, [library])

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false

      return undefined
    }

    const timer = setTimeout(() => {
      const result = saveLibrary(storage, latest.current)

      dirty.current = !result.saved
      setSaveResult(result)
    }, SAVE_DELAY)

    return () => clearTimeout(timer)
  }, [library, storage])

  useEffect(
    () => () => {
      if (dirty.current) saveLibrary(storage, latest.current)
    },
    [storage],
  )

  const actions = useMemo(
    () => ({
      add: (resume) => setLibrary((current) => addResume(current, resume)),
      // Returns the new resume: the pages navigate to it, and reading it back out
      // of the library would be a race against the state update.
      create: ({ name, markdown, settings } = {}) => {
        const resume = createResume({ name, markdown, settings })

        setLibrary((current) => addResume(current, resume))

        return resume
      },
      update: (id, patch) => setLibrary((current) => updateResume(current, id, patch)),
      rename: (id, name) => setLibrary((current) => renameResume(current, id, name)),
      remove: (id) => setLibrary((current) => removeResume(current, id)),
      removeMany: (ids) => setLibrary((current) => removeManyResume(current, ids)),
      duplicate: (id) => setLibrary((current) => duplicateResume(current, id)),
      select: (id) => setLibrary((current) => setActiveResume(current, id)),
      replace: (next) => setLibrary(next),
      restoreSamples: () => setLibrary((current) => restoreSampleResumes(current, sampleResumes())),
    }),
    [],
  )

  const active = useMemo(() => pickActive(library), [library])

  return {
    library,
    resumes: sortResumesByRecency(library.resumes),
    activeId: library.activeId,
    active,
    status,
    saveResult,
    actions,
  }
}
