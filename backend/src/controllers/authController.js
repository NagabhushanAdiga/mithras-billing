import { UserModel } from '../models/UserModel.js'
import { AuditModel } from '../models/AuditModel.js'
import { signToken } from '../utils/jwt.js'
import { toPublicUser } from '../utils/helpers.js'
import { isAdminRole } from '../utils/roles.js'
import { ok, fail } from '../utils/response.js'

export const AuthController = {
  async login(req, res) {
    const { username, password } = req.body || {}
    if (!username || !password) {
      return fail(res, 'Username and password are required')
    }

    const account = await UserModel.findByUsername(username)
    if (!account || !UserModel.verifyPassword(account, password)) {
      return fail(res, 'Invalid username or password', 401)
    }

    const user = toPublicUser(account)
    const token = signToken(user)

    await AuditModel.create({
      action: 'login',
      category: 'auth',
      details: `Signed in as ${user.username} (${user.role})`,
      actor: user,
    })

    return ok(res, { user, token })
  },

  async me(req, res) {
    return ok(res, { user: req.user })
  },

  async logout(req, res) {
    await AuditModel.create({
      action: 'logout',
      category: 'auth',
      details: `Signed out (${req.user.username})`,
      actor: req.user,
    })
    return ok(res, { message: 'Logged out' })
  },

  async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body || {}
    if (!isAdminRole(req.user.role)) {
      return fail(res, 'Only admin can change password here', 403)
    }

    const trimmedNew = String(newPassword || '').trim()
    if (trimmedNew.length < 4) {
      return fail(res, 'New password must be at least 4 characters')
    }

    const account = await UserModel.findById(req.user.id)
    if (!account) return fail(res, 'Account not found', 404)
    if (!UserModel.verifyPassword(account, currentPassword)) {
      return fail(res, 'Current password is incorrect')
    }

    await UserModel.updatePassword(req.user.id, trimmedNew)
    await AuditModel.create({
      action: 'password_changed',
      category: 'team',
      details: 'Admin password updated',
      actor: req.user,
    })
    return ok(res, { message: 'Password updated' })
  },

  async verifyPassword(req, res) {
    const { password } = req.body || {}
    const account = await UserModel.findById(req.user.id)
    const valid = Boolean(account && UserModel.verifyPassword(account, password))
    return ok(res, { valid })
  },
}
