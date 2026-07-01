import { Order } from '../models/schemas/Order.js'

export function randomInvoiceId() {
  const n = Math.floor(Math.random() * 100000)
  return `INV${String(n).padStart(5, '0')}`
}

async function invoiceIdTaken(id) {
  const row = await Order.findOne({ id }).select('id').lean()
  return Boolean(row)
}

export async function generateUniqueInvoiceId() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const id = randomInvoiceId()
    if (!(await invoiceIdTaken(id))) return id
  }
  const fallback = `INV${String(Date.now() % 100000).padStart(5, '0')}`
  return (await invoiceIdTaken(fallback))
    ? `INV${String((Date.now() + 1) % 100000).padStart(5, '0')}`
    : fallback
}
