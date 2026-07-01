import express from 'express'

let app

try {
  const mod = await import('../src/app.js')
  app = mod.default
} catch (error) {
  console.error('API bootstrap failed:', error)
  app = express()
  app.all('*', (_req, res) => {
    res.status(500).json({
      ok: false,
      error: 'API failed to start',
      details: error.message,
    })
  })
}

export default app
