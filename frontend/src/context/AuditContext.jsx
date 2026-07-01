import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { USE_API } from '../api/client'
import * as auditService from '../api/services/auditService'
import {
  loadAuditLog,
  logAudit as writeAudit,
  clearAuditLog as wipeAudit,
  subscribeAuditLog,
} from '../utils/auditLog'

const AuditContext = createContext(null)
const MAX_ENTRIES = 1000

export function AuditProvider({ children }) {
  const [entries, setEntries] = useState(() => (USE_API ? [] : loadAuditLog()))

  useEffect(() => {
    if (!USE_API) {
      return subscribeAuditLog(setEntries)
    }

    let cancelled = false
    auditService
      .list()
      .then((data) => {
        if (!cancelled) setEntries(data.entries || [])
      })
      .catch(() => {
        if (!cancelled) setEntries([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  const logAudit = useCallback((action, opts = {}) => {
    if (USE_API) {
      auditService
        .create({
          action,
          category: opts.category,
          details: opts.details,
        })
        .then((data) => {
          const entry = data.entry
          if (entry) {
            setEntries((prev) => [entry, ...prev].slice(0, MAX_ENTRIES))
          }
        })
        .catch(() => {})
      return null
    }
    return writeAudit(action, opts)
  }, [])

  const clearAuditLog = useCallback(() => {
    if (USE_API) {
      setEntries([])
      return
    }
    wipeAudit()
  }, [])

  return (
    <AuditContext.Provider value={{ entries, logAudit, clearAuditLog }}>
      {children}
    </AuditContext.Provider>
  )
}

export function useAudit() {
  const ctx = useContext(AuditContext)
  if (!ctx) throw new Error('useAudit must be used within AuditProvider')
  return ctx
}
