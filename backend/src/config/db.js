import mongoose from 'mongoose'
import { env } from './env.js'

let isConnected = false

export async function connectDb() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  mongoose.set('strictQuery', true)

  await mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: 10000,
  })

  isConnected = true
  console.log('MongoDB connected:', env.mongodbUri.replace(/\/\/.*@/, '//***@'))
  return mongoose.connection
}

export async function disconnectDb() {
  if (!isConnected) return
  await mongoose.disconnect()
  isConnected = false
}

export function getConnectionState() {
  return mongoose.connection.readyState
}
