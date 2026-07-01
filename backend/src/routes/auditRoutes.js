import { Router } from 'express'
import { AuditController, StoreController } from '../controllers/auditController.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

router.use(asyncHandler(authenticate))

router.get('/', requireAdmin, asyncHandler(AuditController.list))
router.post('/', asyncHandler(AuditController.create))
router.delete('/', requireAdmin, asyncHandler(AuditController.clear))

export default router

const storeRouter = Router()
storeRouter.use(asyncHandler(authenticate))
storeRouter.get('/bootstrap', asyncHandler(StoreController.bootstrap))
storeRouter.post('/erase', requireAdmin, asyncHandler(StoreController.eraseAll))
storeRouter.post('/purge', requireAdmin, asyncHandler(StoreController.purge))

export { storeRouter }
