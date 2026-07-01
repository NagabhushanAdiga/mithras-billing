import { Router } from 'express'
import { SettingsController } from '../controllers/settingsController.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

router.use(asyncHandler(authenticate))

router.get('/', asyncHandler(SettingsController.get))
router.put('/', asyncHandler(SettingsController.update))

export default router
