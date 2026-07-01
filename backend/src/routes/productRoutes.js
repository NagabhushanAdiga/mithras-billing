import { Router } from 'express'
import { GroupController } from '../controllers/groupController.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

router.use(asyncHandler(authenticate))

router.get('/', asyncHandler(GroupController.list))
router.post('/', asyncHandler(GroupController.create))
router.put('/:id', asyncHandler(GroupController.update))
router.delete('/:id', asyncHandler(GroupController.remove))
router.post('/:id/subcategories', asyncHandler(GroupController.addSubcategory))
router.put('/:groupId/subcategories/:subcategoryId', asyncHandler(GroupController.updateSubcategory))
router.delete('/:groupId/subcategories/:subcategoryId', asyncHandler(GroupController.removeSubcategory))

export default router
