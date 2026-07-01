import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    at: { type: String, required: true, index: true },
    action: { type: String, required: true },
    category: { type: String, default: 'system' },
    details: { type: String, default: '' },
    actor: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { versionKey: false }
)

export const AuditLog = mongoose.model('AuditLog', auditLogSchema)
