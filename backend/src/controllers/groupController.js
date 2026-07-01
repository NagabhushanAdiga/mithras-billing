import { GroupModel } from '../models/GroupModel.js'
import { AuditModel } from '../models/AuditModel.js'
import { ok, fail } from '../utils/response.js'

export const GroupController = {
  async list(req, res) {
    return ok(res, { groups: await GroupModel.findAll() })
  },

  async create(req, res) {
    const name = String(req.body?.name || '').trim()
    if (!name) return fail(res, 'Name is required')
    if (await GroupModel.nameExists(name)) return fail(res, 'Category already exists')

    const group = await GroupModel.create(name)
    await AuditModel.create({
      action: 'category_created',
      category: 'category',
      details: name,
      actor: req.user,
    })
    return ok(res, { group }, 201)
  },

  async update(req, res) {
    const { id } = req.params
    const name = String(req.body?.name || '').trim()
    if (!name) return fail(res, 'Name is required')
    if (await GroupModel.nameExists(name, id)) return fail(res, 'Category already exists')

    const updated = await GroupModel.update(id, name)
    if (!updated) return fail(res, 'Category not found', 404)

    await AuditModel.create({
      action: 'category_updated',
      category: 'category',
      details: name,
      actor: req.user,
    })
    return ok(res, { group: await GroupModel.findById(id) })
  },

  async remove(req, res) {
    const { id } = req.params
    const group = await GroupModel.findById(id)
    if (!group) return fail(res, 'Category not found', 404)

    await GroupModel.delete(id)
    await AuditModel.create({
      action: 'category_deleted',
      category: 'category',
      details: group.name,
      actor: req.user,
    })
    return ok(res, { message: 'Category deleted' })
  },

  async addSubcategory(req, res) {
    const { id: groupId } = req.params
    const name = String(req.body?.name || '').trim()
    if (!name) return fail(res, 'Name is required')

    const group = await GroupModel.findById(groupId)
    if (!group) return fail(res, 'Category not found', 404)
    if (await GroupModel.subcategoryNameExists(groupId, name)) {
      return fail(res, 'Subcategory already exists')
    }

    const subcategory = await GroupModel.addSubcategory(groupId, name)
    await AuditModel.create({
      action: 'subcategory_created',
      category: 'category',
      details: `${group.name} → ${name}`,
      actor: req.user,
    })
    return ok(res, { subcategory, group: await GroupModel.findById(groupId) }, 201)
  },

  async updateSubcategory(req, res) {
    const { groupId, subcategoryId } = req.params
    const name = String(req.body?.name || '').trim()
    if (!name) return fail(res, 'Name is required')

    const group = await GroupModel.findById(groupId)
    if (!group) return fail(res, 'Category not found', 404)
    if (await GroupModel.subcategoryNameExists(groupId, name, subcategoryId)) {
      return fail(res, 'Subcategory already exists')
    }

    const updated = await GroupModel.updateSubcategory(groupId, subcategoryId, name)
    if (!updated) return fail(res, 'Subcategory not found', 404)

    await AuditModel.create({
      action: 'subcategory_updated',
      category: 'category',
      details: `${group.name} → ${name}`,
      actor: req.user,
    })
    return ok(res, { group: await GroupModel.findById(groupId) })
  },

  async removeSubcategory(req, res) {
    const { groupId, subcategoryId } = req.params
    const group = await GroupModel.findById(groupId)
    if (!group) return fail(res, 'Category not found', 404)

    const sub = group.subcategories.find((s) => s.id === subcategoryId)
    await GroupModel.deleteSubcategory(groupId, subcategoryId)
    await AuditModel.create({
      action: 'subcategory_deleted',
      category: 'category',
      details: `${group.name} → ${sub?.name || subcategoryId}`,
      actor: req.user,
    })
    return ok(res, { group: await GroupModel.findById(groupId) })
  },
}
