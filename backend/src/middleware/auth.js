import { verifyToken } from '../utils/jwt.js'
import { UserModel } from '../models/UserModel.js'
import { toPublicUser } from '../utils/helpers.js'
import { isAdminRole } from '../utils/roles.js'
import { fail } from '../utils/response.js'

export async function authenticate(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return fail(res, 'Authentication required', 401)
  }

  try {
    const payload = verifyToken(token)
    const account = await UserModel.findById(payload.sub)
    if (!account) {
      return fail(res, 'Invalid session', 401)
    }
    req.user = toPublicUser(account)
    next()
  } catch {
    return fail(res, 'Invalid or expired token', 401)
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || !isAdminRole(req.user.role)) {
    return fail(res, 'Forbidden', 403)
  }
  next()
}
