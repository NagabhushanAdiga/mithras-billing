import { Router } from 'express'
import { AuthController } from '../controllers/authController.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

router.post('/login', asyncHandler(AuthController.login))
router.get('/me', asyncHandler(authenticate), asyncHandler(AuthController.me))
router.post('/logout', asyncHandler(authenticate), asyncHandler(AuthController.logout))
router.post(
  '/change-password',
  asyncHandler(authenticate),
  requireAdmin,
  asyncHandler(AuthController.changePassword)
)
router.post('/verify-password', asyncHandler(authenticate), asyncHandler(AuthController.verifyPassword))

export default router
