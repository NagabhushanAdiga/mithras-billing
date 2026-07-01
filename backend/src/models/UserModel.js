import bcrypt from 'bcryptjs'
import { User } from './schemas/User.js'
import { createId, toPublicUser } from '../utils/helpers.js'

function toAuthUser(doc) {
  if (!doc) return null
  return {
    id: doc.id,
    username: doc.username,
    password_hash: doc.passwordHash,
    name: doc.name,
    role: doc.role,
    created_at: doc.createdAt,
  }
}

export const UserModel = {
  async findAll() {
    const rows = await User.find().sort({ name: 1 }).lean()
    return rows.map(toAuthUser)
  },

  async findTeamMembers() {
    const rows = await User.find({ role: { $in: ['cashier', 'manager', 'admin'] } })
      .sort({ name: 1 })
      .lean()
    return rows.map(toPublicUser)
  },

  async findById(id) {
    const row = await User.findOne({ id }).lean()
    return toAuthUser(row)
  },

  async findByUsername(username) {
    const row = await User.findOne({
      username: String(username).trim().toLowerCase(),
    }).lean()
    return toAuthUser(row)
  },

  verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.password_hash)
  },

  async create({ name, username, password, role }) {
    const id = createId('usr')
    await User.create({
      id,
      username: String(username).trim().toLowerCase(),
      passwordHash: bcrypt.hashSync(password, 10),
      name,
      role,
    })
    return this.findById(id)
  },

  async updatePassword(id, password) {
    await User.updateOne({ id }, { passwordHash: bcrypt.hashSync(password, 10) })
  },

  async delete(id) {
    const result = await User.deleteOne({ id })
    return { changes: result.deletedCount }
  },
}
