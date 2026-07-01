import { useCallback, useState } from 'react'

/** Single-object local state: pendingChanges, setPendingChanges, patchPendingChanges. */
export function usePendingChanges(initialState) {
  const [pendingChanges, setPendingChanges] = useState(initialState)
  const patchPendingChanges = useCallback(
    (updates) => setPendingChanges((prev) => ({ ...prev, ...updates })),
    []
  )
  return { pendingChanges, setPendingChanges, patchPendingChanges }
}
