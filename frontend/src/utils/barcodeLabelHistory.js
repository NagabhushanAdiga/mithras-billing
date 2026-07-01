const STORAGE_KEY = 'billing_barcode_labels'
const MAX_ITEMS = 48

export function loadBarcodeLabels() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  return list
}

/**
 * Save or refresh a generated barcode label in history (newest first).
 */
export function saveBarcodeLabel(entry) {
  const list = loadBarcodeLabels()
  const barcode = String(entry.barcode || '').trim()
  if (!barcode) return list

  const normalized = {
    id: entry.id || `bl-${Date.now()}`,
    createdAt: entry.createdAt || new Date().toISOString(),
    barcode,
    label: String(entry.label || '').trim(),
    price: entry.price != null ? String(entry.price) : '',
    quantityLabel: String(entry.quantityLabel || '').trim(),
    showPriceOnLabel: Boolean(entry.showPriceOnLabel),
    showQuantityOnLabel: Boolean(entry.showQuantityOnLabel),
    mode: entry.mode === 'product' ? 'product' : 'manual',
    productId: entry.productId || '',
  }

  const withoutDup = list.filter(
    (x) => !(x.barcode === normalized.barcode && x.label === normalized.label)
  )
  return persist([normalized, ...withoutDup].slice(0, MAX_ITEMS))
}

export function removeBarcodeLabel(id) {
  return persist(loadBarcodeLabels().filter((x) => x.id !== id))
}

export function clearBarcodeLabels() {
  persist([])
  return []
}
