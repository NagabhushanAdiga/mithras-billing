import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { connectDb } from './config/db.js'
import routes from './routes/index.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import './models/schemas/index.js'

const app = express()

const origins = env.corsOrigin.split(',').map((o) => o.trim())

app.use(
  cors({
    origin: origins,
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))

app.use(async (req, res, next) => {
  try {
    await connectDb()
    next()
  } catch (err) {
    next(err)
  }
})

// Local dev uses /api/*; Vercel may deliver either /api/* or stripped paths.
app.use('/api', routes)
if (env.isVercel) {
  app.use(routes)

  const rootHandler = (_req, res) => {
    res.json({
      ok: true,
      service: 'billing-api',
      message: 'API is running. Try /api/health',
    })
  }
  app.get('/', rootHandler)
  app.get('/api', rootHandler)
}

app.use(notFoundHandler)
app.use(errorHandler)

export default app
