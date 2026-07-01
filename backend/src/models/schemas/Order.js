import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    date: { type: String, required: true, index: true },
    createdById: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.Mixed, default: null },
    customerName: { type: String, default: '' },
    customerMobile: { type: String, default: '' },
    items: { type: [mongoose.Schema.Types.Mixed], default: [] },
    grossSubtotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    totalBeforeBillDiscount: { type: Number, default: 0 },
    billDiscount: { type: Number, default: 0 },
    billDiscountType: { type: String, default: 'amount' },
    billDiscountAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false }, versionKey: false }
)

export const Order = mongoose.model('Order', orderSchema)
