import mongoose from 'mongoose'

const subcategorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
  },
  { _id: false }
)

const groupSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true },
    subcategories: { type: [subcategorySchema], default: [] },
  },
  { versionKey: false }
)

export const Group = mongoose.model('Group', groupSchema)
