import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'cashier', 'manager'] },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false }, versionKey: false }
)

export const User = mongoose.model('User', userSchema)
