import { connectDb, disconnectDb } from '../config/db.js'
import '../models/schemas/index.js'

export async function runInit() {
  await connectDb()
  console.log('MongoDB ready — indexes are managed by Mongoose schemas.')
  await disconnectDb()
}

runInit().catch((err) => {
  console.error(err)
  process.exit(1)
})
