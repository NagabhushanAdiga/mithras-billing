import { Group } from './schemas/Group.js'
import { Product } from './schemas/Product.js'
import { createId, caseInsensitiveExact } from '../utils/helpers.js'

function mapGroup(doc) {
  return {
    id: doc.id,
    name: doc.name,
    subcategories: (doc.subcategories || []).map((s) => ({ id: s.id, name: s.name })),
  }
}

export const GroupModel = {
  async findAll() {
    const groups = await Group.find().sort({ name: 1 }).lean()
    return groups.map(mapGroup)
  },

  async findById(id) {
    const group = await Group.findOne({ id }).lean()
    return group ? mapGroup(group) : null
  },

  async create(name) {
    const id = createId('grp')
    const doc = await Group.create({ id, name, subcategories: [] })
    return mapGroup(doc.toObject())
  },

  async update(id, name) {
    const result = await Group.updateOne({ id }, { name })
    return result.modifiedCount > 0
  },

  async delete(id) {
    await Group.deleteOne({ id })
    await Product.updateMany(
      { groupId: id },
      { $set: { groupId: '', subcategoryId: '', category: '' } }
    )
  },

  async addSubcategory(groupId, name) {
    const id = createId('sub')
    await Group.updateOne({ id: groupId }, { $push: { subcategories: { id, name } } })
    return { id, name }
  },

  async updateSubcategory(groupId, subcategoryId, name) {
    const result = await Group.updateOne(
      { id: groupId, 'subcategories.id': subcategoryId },
      { $set: { 'subcategories.$.name': name } }
    )
    return result.modifiedCount > 0
  },

  async deleteSubcategory(groupId, subcategoryId) {
    await Group.updateOne({ id: groupId }, { $pull: { subcategories: { id: subcategoryId } } })
    await Product.updateMany({ subcategoryId }, { $set: { subcategoryId: '' } })
  },

  async nameExists(name, excludeId = null) {
    const query = { name: caseInsensitiveExact(name) }
    if (excludeId) query.id = { $ne: excludeId }
    const row = await Group.findOne(query).select('id').lean()
    return Boolean(row)
  },

  async deleteAll() {
    await Group.deleteMany({})
    await Product.updateMany({}, { $set: { groupId: '', subcategoryId: '', category: '' } })
  },

  async subcategoryNameExists(groupId, name, excludeId = null) {
    const group = await Group.findOne({ id: groupId }).lean()
    if (!group) return false
    const normalized = String(name).trim().toLowerCase()
    return (group.subcategories || []).some(
      (sub) =>
        sub.name.trim().toLowerCase() === normalized && (!excludeId || sub.id !== excludeId)
    )
  },
}
