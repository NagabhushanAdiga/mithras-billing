import mongoose from 'mongoose'

const batchSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true },
  },
  { versionKey: false }
)

export const Batch = mongoose.model('Batch', batchSchema)
