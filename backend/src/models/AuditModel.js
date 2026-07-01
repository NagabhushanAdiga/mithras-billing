import { AuditLog } from './schemas/AuditLog.js'
import { createId } from '../utils/helpers.js'

const MAX_ENTRIES = 1000

function mapEntry(doc) {
  return {
    id: doc.id,
    at: doc.at,
    action: doc.action,
    category: doc.category,
    details: doc.details,
    actor: doc.actor || null,
  }
}

export const AuditModel = {
  async findAll({ category, limit = MAX_ENTRIES } = {}) {
    const query = category ? { category } : {}
    const rows = await AuditLog.find(query).sort({ at: -1 }).limit(limit).lean()
    return rows.map(mapEntry)
  },

  async create({ action, category = 'system', details = '', actor = null }) {
    const id = createId('aud')
    const at = new Date().toISOString()
    await AuditLog.create({
      id,
      at,
      action,
      category,
      details: String(details || ''),
      actor,
    })
    return { id, at, action, category, details, actor }
  },

  async clear() {
    await AuditLog.deleteMany({})
  },
}
