/** Random invoice id: INV + 5-digit number (e.g. INV048291). */
export function randomInvoiceId() {
  const n = Math.floor(Math.random() * 100000)
  return `INV${String(n).padStart(5, '0')}`
}

/** Generate INV id not present in existing orders. */
export function generateUniqueInvoiceId(isTaken) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const id = randomInvoiceId()
    if (!isTaken(id)) return id
  }
  const fallback = `INV${String(Date.now() % 100000).padStart(5, '0')}`
  return isTaken(fallback) ? `INV${String((Date.now() + 1) % 100000).padStart(5, '0')}` : fallback
}
