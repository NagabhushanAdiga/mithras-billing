export function sanitizeBarcode(value) {
  return String(value || '').replace(/[^0-9A-Za-z\-_.]/g, '')
}

export function isBarcodeTaken(products, barcode, excludeProductId = null) {
  const code = sanitizeBarcode(barcode)
  if (!code) return false
  return products.some(
    (p) => sanitizeBarcode(p.barcode) === code && p.id !== excludeProductId
  )
}

export function generateUniqueBarcode(products) {
  const taken = new Set(products.map((p) => sanitizeBarcode(p.barcode)).filter(Boolean))

  for (let i = 0; i < 200; i++) {
    const suffix = String(Date.now() + i).slice(-9)
    const candidate = sanitizeBarcode(`890${suffix}`)
    if (candidate && !taken.has(candidate)) return candidate
  }

  return sanitizeBarcode(`890${Date.now()}${Math.random().toString(36).slice(2, 6)}`)
}
