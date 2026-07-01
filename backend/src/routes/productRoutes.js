import { Router } from 'express'
import { ProductController } from '../controllers/productController.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

router.use(asyncHandler(authenticate))

router.get('/', asyncHandler(ProductController.list))
router.get('/barcode/:barcode', asyncHandler(ProductController.getByBarcode))
router.post('/', asyncHandler(ProductController.create))
router.put('/:id', asyncHandler(ProductController.update))
router.delete('/:id', asyncHandler(ProductController.remove))

export default router
