import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import routes from './routes/index.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

const app = express()

const origins = env.corsOrigin.split(',').map((o) => o.trim())

app.use(
  cors({
    origin: origins,
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))

app.use('/api', routes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
