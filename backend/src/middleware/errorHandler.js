import { AppError } from '../utils/response.js'

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err)

  const status = err.status || 500
  const message = err.message || 'Internal server error'

  if (process.env.NODE_ENV !== 'production') {
    console.error(err)
  }

  res.status(status).json({
    ok: false,
    error: message,
  })
}

export function notFoundHandler(req, res) {
  res.status(404).json({ ok: false, error: 'Route not found' })
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export { AppError }
