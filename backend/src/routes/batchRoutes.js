import { Router } from 'express'
import { BatchController } from '../controllers/batchController.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

router.use(asyncHandler(authenticate))

router.get('/', asyncHandler(BatchController.list))
router.post('/', asyncHandler(BatchController.create))
router.delete('/:id', asyncHandler(BatchController.remove))

export default router
