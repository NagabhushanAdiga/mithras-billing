import { Router } from 'express'
import { OrderController } from '../controllers/orderController.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

router.use(asyncHandler(authenticate))

router.get('/', asyncHandler(OrderController.list))
router.post('/', asyncHandler(OrderController.create))

export default router
