import { SettingsModel } from '../models/SettingsModel.js'
import { AuditModel } from '../models/AuditModel.js'
import { ok } from '../utils/response.js'

export const SettingsController = {
  async get(req, res) {
    return ok(res, { settings: await SettingsModel.get() })
  },

  async update(req, res) {
    const settings = await SettingsModel.update(req.body || {})
    await AuditModel.create({
      action: 'settings_updated',
      category: 'settings',
      details: 'Store settings updated',
      actor: req.user,
    })
    return ok(res, { settings })
  },
}
