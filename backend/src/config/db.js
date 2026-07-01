import mongoose from 'mongoose'
import { env } from './env.js'

const globalCache = globalThis

if (!globalCache._mongooseCache) {
  globalCache._mongooseCache = { conn: null, promise: null }
}

const cache = globalCache._mongooseCache

export async function connectDb() {
  if (cache.conn && mongoose.connection.readyState === 1) {
    return cache.conn
  }

  if (!cache.promise) {
    mongoose.set('strictQuery', true)
    cache.promise = mongoose
      .connect(env.mongodbUri, {
        serverSelectionTimeoutMS: 10000,
        bufferCommands: false,
      })
      .then((instance) => instance)
  }

  cache.conn = await cache.promise
  return cache.conn
}

export async function disconnectDb() {
  if (!cache.conn) return
  await mongoose.disconnect()
  cache.conn = null
  cache.promise = null
}

export function getConnectionState() {
  return mongoose.connection.readyState
}
