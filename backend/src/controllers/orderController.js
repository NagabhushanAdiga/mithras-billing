import { OrderModel } from '../models/OrderModel.js'
import { ProductModel } from '../models/ProductModel.js'
import { AuditModel } from '../models/AuditModel.js'
import { isAdminRole } from '../utils/roles.js'
import { ok, fail } from '../utils/response.js'

export const OrderController = {
  async list(req, res) {
    let orders = await OrderModel.findAll()
    if (!isAdminRole(req.user.role)) {
      orders = orders.filter(
        (o) =>
          o.createdBy?.id === req.user.id ||
          o.createdBy?.username === req.user.username
      )
    }
    return ok(res, { orders })
  },

  async create(req, res) {
    const body = req.body || {}
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return fail(res, 'Order must have at least one item')
    }

    const order = await OrderModel.create(
      {
        ...body,
        createdBy: body.createdBy || req.user,
      },
      req.user
    )
    await ProductModel.deductStockForOrder(body.items)

    await AuditModel.create({
      action: 'bill_created',
      category: 'billing',
      details: `Bill ${order.id} · ${order.items.length} items · total ${Number(order.total).toFixed(2)}`,
      actor: req.user,
    })
    return ok(res, { order, id: order.id }, 201)
  },
}
