import { ProductModel } from '../models/ProductModel.js'
import { AuditModel } from '../models/AuditModel.js'
import { ok, fail } from '../utils/response.js'

function generateBarcode() {
  return `890${Date.now().toString().slice(-10)}`
}

export const ProductController = {
  async list(req, res) {
    return ok(res, { products: await ProductModel.findAll() })
  },

  async getByBarcode(req, res) {
    const product = await ProductModel.findByBarcode(req.params.barcode)
    if (!product) return fail(res, 'Product not found', 404)
    return ok(res, { product })
  },

  async create(req, res) {
    const body = req.body || {}
    let barcode = String(body.barcode || '').trim()
    if (!barcode) {
      barcode = generateBarcode()
      while (await ProductModel.barcodeTaken(barcode)) {
        barcode = generateBarcode()
      }
    } else if (await ProductModel.barcodeTaken(barcode)) {
      return fail(res, 'Barcode already in use')
    }

    if (!body.name) return fail(res, 'Product name is required')

    const product = await ProductModel.create({ ...body, barcode })
    await AuditModel.create({
      action: 'product_created',
      category: 'product',
      details: `${product.name} (${product.barcode})`,
      actor: req.user,
    })
    return ok(res, { product, id: product.id }, 201)
  },

  async update(req, res) {
    const { id } = req.params
    const updates = { ...(req.body || {}) }

    const existing = await ProductModel.findById(id)
    if (!existing) return fail(res, 'Product not found', 404)

    delete updates.barcode
    delete updates.name

    await ProductModel.update(id, updates)
    await AuditModel.create({
      action: 'product_updated',
      category: 'product',
      details: existing.name,
      actor: req.user,
    })
    return ok(res, { product: await ProductModel.findById(id) })
  },

  async remove(req, res) {
    const { id } = req.params
    const existing = await ProductModel.findById(id)
    if (!existing) return fail(res, 'Product not found', 404)

    await ProductModel.delete(id)
    await AuditModel.create({
      action: 'product_deleted',
      category: 'product',
      details: existing.name,
      actor: req.user,
    })
    return ok(res, { message: 'Product deleted' })
  },
}
