import { Settings } from './schemas/Settings.js'

const DEFAULTS = {
  storeName: 'SuperMart Billing',
  storeAddress: '',
  storeGstin: '',
  storeWebsite: '',
  storeUpiId: '',
  taxRate: 5,
  currency: '₹',
  discountEnabled: true,
  discountType: 'percent',
  maxDiscountPercent: 50,
  billDiscountEnabled: false,
}

function mapSettings(doc) {
  if (!doc) return { ...DEFAULTS }
  return {
    storeName: doc.storeName,
    storeAddress: doc.storeAddress,
    storeGstin: doc.storeGstin,
    storeWebsite: doc.storeWebsite,
    storeUpiId: doc.storeUpiId,
    taxRate: doc.taxRate,
    currency: doc.currency,
    discountEnabled: Boolean(doc.discountEnabled),
    discountType: doc.discountType,
    maxDiscountPercent: doc.maxDiscountPercent,
    billDiscountEnabled: Boolean(doc.billDiscountEnabled),
  }
}

export const SettingsModel = {
  async get() {
    let row = await Settings.findOne({ singletonKey: 'default' }).lean()
    if (!row) {
      row = (await Settings.create({ singletonKey: 'default' })).toObject()
    }
    return mapSettings(row)
  },

  async update(updates) {
    const current = await this.get()
    const next = { ...current, ...updates }
    const row = await Settings.findOneAndUpdate(
      { singletonKey: 'default' },
      {
        storeName: next.storeName,
        storeAddress: next.storeAddress,
        storeGstin: next.storeGstin,
        storeWebsite: next.storeWebsite,
        storeUpiId: next.storeUpiId,
        taxRate: Number(next.taxRate),
        currency: next.currency,
        discountEnabled: Boolean(next.discountEnabled),
        discountType: next.discountType,
        maxDiscountPercent: Number(next.maxDiscountPercent),
        billDiscountEnabled: Boolean(next.billDiscountEnabled),
      },
      { new: true, upsert: true }
    ).lean()
    return mapSettings(row)
  },

  async reset() {
    await Settings.deleteMany({})
    const row = (await Settings.create({ singletonKey: 'default' })).toObject()
    return mapSettings(row)
  },
}
