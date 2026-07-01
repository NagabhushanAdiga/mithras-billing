import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, default: 'default', unique: true },
    storeName: { type: String, default: 'SuperMart Billing' },
    storeAddress: { type: String, default: '' },
    storeGstin: { type: String, default: '' },
    storeWebsite: { type: String, default: '' },
    storeUpiId: { type: String, default: '' },
    taxRate: { type: Number, default: 5 },
    currency: { type: String, default: '₹' },
    discountEnabled: { type: Boolean, default: true },
    discountType: { type: String, default: 'percent' },
    maxDiscountPercent: { type: Number, default: 50 },
    billDiscountEnabled: { type: Boolean, default: false },
  },
  { versionKey: false }
)

export const Settings = mongoose.model('Settings', settingsSchema)
