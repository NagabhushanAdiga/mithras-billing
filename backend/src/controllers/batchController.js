import { BatchModel } from '../models/BatchModel.js'
import { AuditModel } from '../models/AuditModel.js'
import { ok, fail } from '../utils/response.js'

export const BatchController = {
  async list(req, res) {
    return ok(res, { batches: await BatchModel.findAll() })
  },

  async create(req, res) {
    const name = String(req.body?.name || '').trim()
    if (!name) return fail(res, 'Name is required')
    if (await BatchModel.nameExists(name)) return fail(res, 'Batch already exists')

    const batch = await BatchModel.create(name)
    await AuditModel.create({
      action: 'batch_created',
      category: 'category',
      details: name,
      actor: req.user,
    })
    return ok(res, { batch }, 201)
  },

  async remove(req, res) {
    const { id } = req.params
    const batch = await BatchModel.findById(id)
    if (!batch) return fail(res, 'Batch not found', 404)

    await BatchModel.delete(id)
    await AuditModel.create({
      action: 'batch_deleted',
      category: 'category',
      details: batch.name,
      actor: req.user,
    })
    return ok(res, { message: 'Batch deleted' })
  },
}
