import { USE_API } from '../api/client'
import * as auditService from '../api/services/auditService'

const STORAGE_KEY = 'billing_audit_log'
const MAX_ENTRIES = 1000

const listeners = new Set()
const apiEntryListeners = new Set()

function loadActor() {
  try {
    const saved = localStorage.getItem('billing_user')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export const AUDIT_CATEGORIES = [
  { value: '', label: 'All activity' },
  { value: 'auth', label: 'Auth' },
  { value: 'billing', label: 'Billing' },
  { value: 'product', label: 'Products' },
  { value: 'category', label: 'Categories' },
  { value: 'settings', label: 'Settings' },
  { value: 'team', label: 'Team' },
  { value: 'report', label: 'Reports' },
  { value: 'system', label: 'System' },
]

export function loadAuditLog() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveAuditLog(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function notify() {
  const entries = loadAuditLog()
  listeners.forEach((listener) => listener(entries))
}

export function subscribeAuditLog(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Live API audit entries (production) */
export function onAuditEntry(listener) {
  apiEntryListeners.add(listener)
  return () => apiEntryListeners.delete(listener)
}

/**
 * @param {string} action Short action key, e.g. "bill_created"
 * @param {{ category?: string, details?: string, actor?: object }} [opts]
 */
export function logAudit(action, { category = 'system', details = '', actor } = {}) {
  if (USE_API) {
    auditService
      .create({ action, category, details })
      .then((data) => {
        const entry = data?.entry
        if (entry) apiEntryListeners.forEach((listener) => listener(entry))
      })
      .catch(() => {})
    return null
  }

  const user = actor || loadActor()
  const entry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    action,
    category,
    details: String(details || ''),
    actor: user
      ? { id: user.id, username: user.username, name: user.name, role: user.role }
      : null,
  }
  const next = [entry, ...loadAuditLog()].slice(0, MAX_ENTRIES)
  saveAuditLog(next)
  notify()
  return entry
}

export function clearAuditLog() {
  saveAuditLog([])
  notify()
}

export function formatAuditAction(action) {
  return String(action || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatAuditTime(iso) {
  const d = new Date(iso)
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}
