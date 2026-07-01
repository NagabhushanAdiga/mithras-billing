export function ok(res, data, status = 200) {
  return res.status(status).json({ ok: true, data })
}

export function fail(res, message, status = 400) {
  return res.status(status).json({ ok: false, error: message })
}

export class AppError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}
