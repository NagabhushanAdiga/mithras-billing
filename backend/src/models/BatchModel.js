import { Batch } from './schemas/Batch.js'
import { Product } from './schemas/Product.js'
import { createId, caseInsensitiveExact } from '../utils/helpers.js'

export const BatchModel = {
  async findAll() {
    return Batch.find().sort({ name: 1 }).select('id name').lean()
  },

  async findById(id) {
    return Batch.findOne({ id }).select('id name').lean()
  },

  async create(name) {
    const id = createId('bat')
    await Batch.create({ id, name })
    return { id, name }
  },

  async delete(id) {
    await Batch.deleteOne({ id })
    await Product.updateMany({ batch: { $regex: id } }, { $set: { batch: '' } })
  },

  async deleteAll() {
    await Batch.deleteMany({})
    await Product.updateMany({}, { $set: { batch: '' } })
  },

  async nameExists(name) {
    const row = await Batch.findOne({ name: caseInsensitiveExact(name) }).select('id').lean()
    return Boolean(row)
  },
}
