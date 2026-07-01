import { AuditModel } from '../models/AuditModel.js'
import { ProductModel } from '../models/ProductModel.js'
import { OrderModel } from '../models/OrderModel.js'
import { SettingsModel } from '../models/SettingsModel.js'
import { GroupModel } from '../models/GroupModel.js'
import { BatchModel } from '../models/BatchModel.js'
import { ok } from '../utils/response.js'

export const AuditController = {
  async list(req, res) {
    const category = req.query.category || ''
    const entries = await AuditModel.findAll({ category: category || undefined })
    return ok(res, { entries })
  },

  async create(req, res) {
    const { action, category, details } = req.body || {}
    if (!action) return res.status(400).json({ ok: false, error: 'Action is required' })
    const entry = await AuditModel.create({
      action,
      category: category || 'system',
      details: details || '',
      actor: req.user,
    })
    return ok(res, { entry }, 201)
  },

  async clear(req, res) {
    await AuditModel.clear()
    return ok(res, { message: 'Audit log cleared' })
  },
}

export const StoreController = {
  async bootstrap(req, res) {
    return ok(res, {
      products: await ProductModel.findAll(),
      groups: await GroupModel.findAll(),
      batches: await BatchModel.findAll(),
      orders: await OrderModel.findAll(),
      settings: await SettingsModel.get(),
    })
  },

  async eraseAll(req, res) {
    await ProductModel.deleteAll()
    await OrderModel.deleteAll()
    await GroupModel.deleteAll()
    await BatchModel.deleteAll()
    await SettingsModel.reset()

    await AuditModel.create({
      action: 'data_erased',
      category: 'settings',
      details: 'All products, orders, categories, batches, and settings reset',
      actor: req.user,
    })
    return ok(res, { message: 'All data erased' })
  },

  async purge(req, res) {
    const {
      products = false,
      categories = false,
      batches = false,
      orders = false,
      settings = false,
      auditLog = false,
    } = req.body || {}

    if (products) await ProductModel.deleteAll()
    if (orders) await OrderModel.deleteAll()
    if (categories) await GroupModel.deleteAll()
    if (batches) await BatchModel.deleteAll()
    if (settings) await SettingsModel.reset()

    if (auditLog) await AuditModel.clear()

    const removed = [
      products && 'products',
      categories && 'categories',
      batches && 'batches',
      orders && 'orders',
      settings && 'settings',
      auditLog && 'audit log',
    ].filter(Boolean)

    if (removed.length > 0) {
      await AuditModel.create({
        action: removed.length >= 4 ? 'data_erased' : 'data_purged',
        category: 'settings',
        details: `Removed: ${removed.join(', ')}`,
        actor: req.user,
      })
    }

    return ok(res, { message: 'Selected data removed' })
  },
}
