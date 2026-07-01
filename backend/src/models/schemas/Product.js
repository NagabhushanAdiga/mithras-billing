import mongoose from 'mongoose'

const productBatchSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    stock: Number,
    mrp: Number,
    costPrice: Number,
    price: Number,
    discount: Number,
    batchId: String,
  },
  { _id: false, strict: false }
)

const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    barcode: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    hsn: { type: String, default: '' },
    gst: { type: Number, default: 0 },
    groupId: { type: String, default: '', index: true },
    subcategoryId: { type: String, default: '' },
    category: { type: String, default: '' },
    discount: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    mrp: { type: Number, default: null },
    costPrice: { type: Number, default: null },
    batch: { type: String, default: '' },
    image: { type: String, default: '' },
    batches: { type: [productBatchSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
)

export const Product = mongoose.model('Product', productSchema)
