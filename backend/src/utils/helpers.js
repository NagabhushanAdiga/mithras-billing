export function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function parseJson(value, fallback = null) {
  if (value == null || value === '') return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function toPublicUser(row) {
  if (!row) return null
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
  }
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function caseInsensitiveExact(value) {
  return { $regex: new RegExp(`^${escapeRegex(String(value).trim())}$`, 'i') }
}
