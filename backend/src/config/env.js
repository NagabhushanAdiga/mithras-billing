import dotenv from 'dotenv'

dotenv.config()

function cleanEnv(value) {
  if (!value) return value
  let v = value.trim()
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim()
  }
  return v
}

const mongodbUri =
  cleanEnv(process.env.MONGODB_URI) || 'mongodb://127.0.0.1:27017/billing'

export const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin:
    process.env.CORS_ORIGIN ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL},http://localhost:5173`
      : 'http://localhost:5173'),
  isVercel: process.env.VERCEL === '1',
}
