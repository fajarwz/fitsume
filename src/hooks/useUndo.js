import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Undo for a text editor.
 *
 * Snapshot-based rather than diff-based: the document is a string and the fit
 * depends on all of it, so a snapshot is both the simplest and the correct unit.
 *
 * Keystrokes coalesce — one restore point per pause, not one per character — so
 * `Ctrl+Z` after typing a sentence brings back the sentence, not the last letter.
 * Loading a sample or importing a file resets the history instead of joining it,
 * because undoing *into* someone else's document is confusing.
 *
 * The history lives in refs (it is not rendered) and the two flags the UI needs are
 * mirrored into state, which is why nothing is read out of a ref during render.
 */
const COALESCE_MS = 600
const DEFAULT_LIMIT = 60

export function useUndo(value, commit, { limit = DEFAULT_LIMIT, coalesceMs = COALESCE_MS } = {}) {
  const past = useRef([])
  const future = useRef([])
  const pending = useRef(null)
  const timer = useRef(null)
  const current = useRef(value)

  const [flags, setFlags] = useState({ canUndo: false, canRedo: false, depth: 0 })

  const sync = useCallback(() => {
    setFlags({
      canUndo: past.current.length > 0 || pending.current !== null,
      canRedo: future.current.length > 0,
      depth: past.current.length,
    })
  }, [])

  const push = useCallback(
    (leaving) => {
      past.current = [...past.current, leaving].slice(-limit)
      future.current = []
      pending.current = null
      sync()
    },
    [limit, sync],
  )

  useEffect(() => {
    if (value === current.current) return undefined

    if (pending.current === null) {
      pending.current = current.current
      sync()
    }

    current.current = value

    if (timer.current) clearTimeout(timer.current)

    timer.current = setTimeout(() => {
      timer.current = null

      if (pending.current !== null) push(pending.current)
    }, coalesceMs)

    return undefined
  }, [value, coalesceMs, push, sync])

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }

    if (pending.current !== null) push(pending.current)
  }, [push])

  const undo = useCallback(() => {
    flush()

    const previous = past.current[past.current.length - 1]

    if (previous === undefined) return false

    past.current = past.current.slice(0, -1)
    future.current = [current.current, ...future.current].slice(0, limit)
    current.current = previous
    pending.current = null

    commit(previous)
    sync()

    return true
  }, [commit, flush, limit, sync])

  const redo = useCallback(() => {
    flush()

    const next = future.current[0]

    if (next === undefined) return false

    future.current = future.current.slice(1)
    past.current = [...past.current, current.current].slice(-limit)
    current.current = next

    commit(next)
    sync()

    return true
  }, [commit, flush, limit, sync])

  const reset = useCallback(
    (next) => {
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
      }

      past.current = []
      future.current = []
      pending.current = null
      current.current = next ?? value

      sync()
    },
    [value, sync],
  )

  return { undo, redo, reset, ...flags }
}
