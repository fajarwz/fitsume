import { useEffect, useMemo, useRef, useState } from 'react'

import {
  activeResume as pickActive,
  addResume,
  createResume,
  duplicateResume,
  loadLibrary,
  removeResume,
  renameResume,
  saveLibrary,
  setActiveResume,
  updateResume,
} from '../lib/stash.js'

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
  const [initial] = useState(() => loadLibrary(storage))
  const [library, setLibrary] = useState(initial.library)
  const [status] = useState(initial.status)
  const [saveResult, setSaveResult] = useState({ saved: true })

  // Mirrors for the deferred writes. A write that is still pending when the screen
  // goes away must not vanish, so the latest library has to be reachable from a
  // cleanup, where component state is not.
  const latest = useRef(initial.library)
  const dirty = useRef(false)
  const skipFirst = useRef(true)

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
      duplicate: (id) => setLibrary((current) => duplicateResume(current, id)),
      select: (id) => setLibrary((current) => setActiveResume(current, id)),
      replace: (next) => setLibrary(next),
    }),
    [],
  )

  const active = useMemo(() => pickActive(library), [library])

  return {
    library,
    resumes: library.resumes,
    activeId: library.activeId,
    active,
    status,
    saveResult,
    actions,
  }
}
