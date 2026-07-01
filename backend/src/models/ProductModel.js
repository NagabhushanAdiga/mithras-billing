import { Product } from './schemas/Product.js'
import { GroupModel } from './GroupModel.js'
import { createId } from '../utils/helpers.js'

function mapProduct(doc, groups) {
  const group = doc.groupId ? groups.find((g) => g.id === doc.groupId) : null
  const sub = group?.subcategories?.find((s) => s.id === doc.subcategoryId)
  return {
    id: doc.id,
    barcode: doc.barcode,
    name: doc.name,
    hsn: doc.hsn || '',
    gst: doc.gst ?? 0,
    groupId: doc.groupId || '',
    subcategoryId: doc.subcategoryId || '',
    category: doc.category || group?.name || '',
    subcategory: sub?.name || '',
    discount: doc.discount ?? 0,
    price: doc.price ?? 0,
    stock: doc.stock ?? 0,
    mrp: doc.mrp,
    costPrice: doc.costPrice,
    batch: doc.batch || '',
    image: doc.image || '',
    batches: doc.batches || [],
  }
}

function resolveGroupId(value, existingGroupId, groups) {
  if (value === undefined) {
    const current = existingGroupId || null
    return current && groups.some((g) => g.id === current) ? current : null
  }
  if (!value) return null
  return groups.some((g) => g.id === value) ? value : null
}

function resolveSubcategoryId(value, existingSubcategoryId, groupId, groups) {
  if (!groupId) return null
  const group = groups.find((g) => g.id === groupId)
  if (!group) return null
  if (value === undefined) {
    const current = existingSubcategoryId || null
    return current && group.subcategories?.some((s) => s.id === current) ? current : null
  }
  if (!value) return null
  return group.subcategories?.some((s) => s.id === value) ? value : null
}

export const ProductModel = {
  async findAll() {
    const groups = await GroupModel.findAll()
    const rows = await Product.find().sort({ name: 1 }).lean()
    return rows.map((r) => mapProduct(r, groups))
  },

  async findById(id) {
    const row = await Product.findOne({ id }).lean()
    if (!row) return null
    return mapProduct(row, await GroupModel.findAll())
  },

  async findByBarcode(barcode) {
    const row = await Product.findOne({ barcode: String(barcode).trim() }).lean()
    if (!row) return null
    return mapProduct(row, await GroupModel.findAll())
  },

  async barcodeTaken(barcode, excludeId = null) {
    const query = { barcode: String(barcode).trim() }
    if (excludeId) query.id = { $ne: excludeId }
    const row = await Product.findOne(query).select('id').lean()
    return Boolean(row)
  },

  async create(product) {
    const id = product.id || createId(String(Date.now()))
    const groups = await GroupModel.findAll()
    const groupId = resolveGroupId(product.groupId, null, groups) || ''
    const group = groupId ? groups.find((g) => g.id === groupId) : null
    const subcategoryId = resolveSubcategoryId(product.subcategoryId, null, groupId, groups) || ''
    const batches = product.batches || []
    const totalStock = batches.length
      ? batches.reduce((s, b) => s + (Number(b.stock) || 0), 0)
      : Number(product.stock) || 0

    await Product.create({
      id,
      barcode: product.barcode,
      name: product.name,
      hsn: product.hsn || '',
      gst: Number(product.gst) || 0,
      groupId,
      subcategoryId,
      category: product.category || group?.name || '',
      discount: Number(product.discount) || 0,
      price: Number(product.price) || 0,
      stock: totalStock,
      mrp: product.mrp ?? null,
      costPrice: product.costPrice ?? null,
      batch: product.batch || '',
      image: product.image || '',
      batches,
    })

    return this.findById(id)
  },

  async update(id, updates) {
    const existing = await Product.findOne({ id }).lean()
    if (!existing) return false

    const groups = await GroupModel.findAll()
    const groupId = resolveGroupId(updates.groupId, existing.groupId, groups) || ''
    const group = groupId ? groups.find((g) => g.id === groupId) : null
    const subcategoryId =
      resolveSubcategoryId(updates.subcategoryId, existing.subcategoryId, groupId, groups) || ''
    const batches = updates.batches !== undefined ? updates.batches : existing.batches || []
    const totalStock = batches.length
      ? batches.reduce((s, b) => s + (Number(b.stock) || 0), 0)
      : updates.stock !== undefined
        ? Number(updates.stock)
        : existing.stock

    await Product.updateOne(
      { id },
      {
        barcode: updates.barcode !== undefined ? updates.barcode : existing.barcode,
        name: updates.name !== undefined ? updates.name : existing.name,
        hsn: updates.hsn !== undefined ? updates.hsn : existing.hsn,
        gst: updates.gst !== undefined ? Number(updates.gst) : existing.gst,
        groupId,
        subcategoryId,
        category: updates.category !== undefined ? updates.category : group?.name || existing.category,
        discount: updates.discount !== undefined ? Number(updates.discount) : existing.discount,
        price: updates.price !== undefined ? Number(updates.price) : existing.price,
        stock: totalStock,
        mrp: updates.mrp !== undefined ? updates.mrp : existing.mrp,
        costPrice: updates.costPrice !== undefined ? updates.costPrice : existing.costPrice,
        batch: updates.batch !== undefined ? updates.batch : existing.batch,
        image: updates.image !== undefined ? updates.image : existing.image,
        batches,
      }
    )
    return true
  },

  async delete(id) {
    const result = await Product.deleteOne({ id })
    return result.deletedCount > 0
  },

  async deleteAll() {
    await Product.deleteMany({})
  },

  async deductStockForOrder(items) {
    for (const line of items) {
      const product = await Product.findOne({ barcode: line.barcode }).lean()
      if (!product) continue

      const batches = product.batches || []
      const qty = Number(line.qty) || 0

      if (batches.length > 0) {
        let nextBatches = [...batches]
        if (line.productBatchId) {
          nextBatches = nextBatches.map((b) =>
            b.id === line.productBatchId
              ? { ...b, stock: Math.max(0, Number(b.stock) - qty) }
              : b
          )
        } else {
          const target = nextBatches.find((b) => Number(b.stock) > 0) || nextBatches[0]
          if (target) {
            nextBatches = nextBatches.map((b) =>
              b.id === target.id ? { ...b, stock: Math.max(0, Number(b.stock) - qty) } : b
            )
          }
        }
        const totalStock = nextBatches.reduce((s, b) => s + (Number(b.stock) || 0), 0)
        await Product.updateOne({ id: product.id }, { batches: nextBatches, stock: totalStock })
      } else {
        const stock = Number(product.stock)
        if (Number.isFinite(stock)) {
          await Product.updateOne(
            { id: product.id },
            { stock: Math.max(0, stock - qty) }
          )
        }
      }
    }
  },
}
