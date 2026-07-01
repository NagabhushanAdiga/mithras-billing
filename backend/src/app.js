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

// Vercel routes /api/* to api/index.js with the /api prefix stripped
const apiPrefix = env.isVercel ? '' : '/api'
app.use(apiPrefix, routes)

if (env.isVercel) {
  app.get('/', (req, res) => {
    res.json({
      ok: true,
      service: 'billing-api',
      message: 'API is running. Try /api/health',
    })
  })
}

app.use(notFoundHandler)
app.use(errorHandler)

export default app
