import { Order } from './schemas/Order.js'
import { generateUniqueInvoiceId } from '../utils/invoiceId.js'

function mapOrder(doc) {
  return {
    id: doc.id,
    date: doc.date,
    createdBy: doc.createdBy || null,
    customerName: doc.customerName || '',
    customerMobile: doc.customerMobile || '',
    items: doc.items || [],
    grossSubtotal: doc.grossSubtotal,
    discountTotal: doc.discountTotal,
    subtotal: doc.subtotal,
    tax: doc.tax,
    totalBeforeBillDiscount: doc.totalBeforeBillDiscount,
    billDiscount: doc.billDiscount,
    billDiscountType: doc.billDiscountType,
    billDiscountAmount: doc.billDiscountAmount,
    total: doc.total,
  }
}

export const OrderModel = {
  async findAll() {
    const rows = await Order.find().sort({ date: -1 }).lean()
    return rows.map(mapOrder)
  },

  async findById(id) {
    const row = await Order.findOne({ id }).lean()
    return row ? mapOrder(row) : null
  },

  async create(order, actor) {
    const id = order.id || (await generateUniqueInvoiceId())
    const date = order.date || new Date().toISOString()
    const createdBy = order.createdBy || actor || null

    await Order.create({
      id,
      date,
      createdById: createdBy?.id || '',
      createdBy,
      customerName: order.customerName || '',
      customerMobile: order.customerMobile || '',
      items: order.items || [],
      grossSubtotal: Number(order.grossSubtotal) || 0,
      discountTotal: Number(order.discountTotal) || 0,
      subtotal: Number(order.subtotal) || 0,
      tax: Number(order.tax) || 0,
      totalBeforeBillDiscount: Number(order.totalBeforeBillDiscount) || 0,
      billDiscount: Number(order.billDiscount) || 0,
      billDiscountType: order.billDiscountType || 'amount',
      billDiscountAmount: Number(order.billDiscountAmount) || 0,
      total: Number(order.total) || 0,
    })

    return this.findById(id)
  },

  async deleteAll() {
    await Order.deleteMany({})
  },
}
