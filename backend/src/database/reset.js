import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { connectDb, disconnectDb } from '../config/db.js'
import { runSeed } from './seed.js'

dotenv.config()

async function main() {
  await connectDb()
  const collections = await mongoose.connection.db.collections()
  for (const collection of collections) {
    await collection.deleteMany({})
  }
  console.log('All collections cleared.')
  await runSeed()
  await disconnectDb()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
