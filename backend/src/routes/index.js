import { Router } from 'express'
import authRoutes from './authRoutes.js'
import userRoutes from './userRoutes.js'
import productRoutes from './productRoutes.js'
import groupRoutes from './groupRoutes.js'
import batchRoutes from './batchRoutes.js'
import orderRoutes from './orderRoutes.js'
import settingsRoutes from './settingsRoutes.js'
import auditRoutes, { storeRouter } from './auditRoutes.js'
import { getConnectionState } from '../config/db.js'

const router = Router()

router.get('/health', (req, res) => {
  const mongoState = getConnectionState()
  res.json({
    ok: mongoState === 1,
    service: 'billing-api',
    database: mongoState === 1 ? 'connected' : 'disconnected',
  })
})

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/products', productRoutes)
router.use('/groups', groupRoutes)
router.use('/batches', batchRoutes)
router.use('/orders', orderRoutes)
router.use('/settings', settingsRoutes)
router.use('/audit', auditRoutes)
router.use('/store', storeRouter)

export default router
