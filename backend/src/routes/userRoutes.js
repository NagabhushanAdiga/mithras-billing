import { Router } from 'express'
import { UserController } from '../controllers/userController.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

router.use(asyncHandler(authenticate), requireAdmin)

router.get('/', asyncHandler(UserController.list))
router.post('/', asyncHandler(UserController.create))
router.delete('/:id', asyncHandler(UserController.remove))
router.patch('/:id/password', asyncHandler(UserController.resetPassword))

export default router
