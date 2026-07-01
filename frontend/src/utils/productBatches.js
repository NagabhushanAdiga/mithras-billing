import { parseStock } from './billing'

export function createBatchId() {
  return `pb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function emptyBatchRow(overrides = {}) {
  return {
    id: createBatchId(),
    name: '',
    mrp: '',
    costPrice: '',
    sellingPrice: '',
    stock: '',
    manufacturedDate: '',
    expiryDate: '',
    fssai: '',
    ...overrides,
  }
}

function normalizeDateValue(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString().slice(0, 10)
}

function parseBatchRow(b) {
  const sellingPrice = Math.max(0, Number(b.sellingPrice ?? b.price) || 0)
  const mrp = Math.max(0, Number(b.mrp) || sellingPrice || 0)
  const costPrice = Math.max(0, Number(b.costPrice) || 0)
  return {
    id: b.id || createBatchId(),
    name: String(b.name || '').trim(),
    mrp,
    costPrice,
    sellingPrice,
    price: sellingPrice,
    stock: parseStock(b.stock),
    manufacturedDate: normalizeDateValue(b.manufacturedDate),
    expiryDate: String(b.expiryDate || '').trim(),
    fssai: String(b.fssai || '').trim(),
  }
}

/** Build batches[] from stored product (supports legacy single batch/price/stock). */
export function getProductBatches(product, batchesCatalog = []) {
  if (!product) return []

  if (Array.isArray(product.batches) && product.batches.length > 0) {
    return product.batches.map(parseBatchRow)
  }

  const legacyBatchName =
    String(product.batch || '').trim() ||
    (product.batchId
      ? batchesCatalog.find((b) => b.id === product.batchId)?.name
      : '') ||
    ''

  if (legacyBatchName || product.price != null || product.stock != null) {
    const selling = Number(product.price) || 0
    return [
      parseBatchRow({
        id: `pb-legacy-${product.id}`,
        name: legacyBatchName || 'Default',
        mrp: Number(product.mrp) || selling,
        costPrice: Number(product.costPrice) || 0,
        sellingPrice: selling,
        stock: product.stock,
      }),
    ]
  }

  return []
}

export function getTotalStock(product, batchesCatalog = []) {
  const batches = getProductBatches(product, batchesCatalog)
  if (batches.length > 0) {
    return batches.reduce((sum, b) => sum + b.stock, 0)
  }
  const n = Number(product?.stock)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
}

export function getBatchById(product, batchId, batchesCatalog = []) {
  return getProductBatches(product, batchesCatalog).find((b) => b.id === batchId) || null
}

export function getAvailableBatches(product, batchesCatalog = []) {
  return getProductBatches(product, batchesCatalog).filter((b) => b.stock > 0 && b.name)
}

export function formatBatchSummary(product, batchesCatalog = []) {
  const batches = getProductBatches(product, batchesCatalog)
  if (batches.length === 0) return '—'
  if (batches.length === 1) return batches[0].name || '—'
  return batches.map((b) => b.name).filter(Boolean).join(', ') || `${batches.length} batches`
}

export function formatBatchDateLabel(iso) {
  const normalized = normalizeDateValue(iso)
  if (!normalized) return ''
  const [year, month, day] = normalized.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return normalized
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatBatchDates(batch) {
  if (!batch) return ''
  const parts = []
  if (batch.manufacturedDate) {
    parts.push(`Mfg ${formatBatchDateLabel(batch.manufacturedDate)}`)
  }
  if (batch.expiryDate) {
    parts.push(`Exp ${batch.expiryDate}`)
  }
  if (batch.fssai) {
    parts.push(`FSSAI ${batch.fssai}`)
  }
  return parts.join(' · ')
}

function batchSellingPrices(batches) {
  return batches.map((b) => b.sellingPrice ?? b.price).filter((p) => Number.isFinite(p))
}

export function formatPriceRange(product, currency = '₹', batchesCatalog = []) {
  const batches = getProductBatches(product, batchesCatalog)
  if (batches.length === 0) {
    return `${currency}${Number(product.price || 0).toFixed(2)}`
  }
  const prices = batchSellingPrices(batches)
  if (prices.length === 0) return `${currency}0.00`
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === max) return `${currency}${min.toFixed(2)}`
  return `${currency}${min.toFixed(2)} – ${currency}${max.toFixed(2)}`
}

export function formatMrpRange(product, currency = '₹', batchesCatalog = []) {
  const batches = getProductBatches(product, batchesCatalog)
  const prices = batches.map((b) => b.mrp).filter((p) => Number.isFinite(p) && p > 0)
  if (prices.length === 0) return '—'
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === max) return `${currency}${min.toFixed(2)}`
  return `${currency}${min.toFixed(2)} – ${currency}${max.toFixed(2)}`
}

/** Form rows use string fields for inputs. */
export function batchesToFormRows(product, batchesCatalog = []) {
  const batches = getProductBatches(product, batchesCatalog)
  if (batches.length === 0) {
    return [emptyBatchRow({ name: 'batch 1' })]
  }
  return batches.map((b) => ({
    id: b.id,
    name: b.name,
    mrp: String(b.mrp ?? ''),
    costPrice: String(b.costPrice ?? ''),
    sellingPrice: String(b.sellingPrice ?? b.price ?? ''),
    stock: String(b.stock ?? ''),
    manufacturedDate: b.manufacturedDate || '',
    expiryDate: b.expiryDate || '',
    fssai: b.fssai || '',
  }))
}

export function parseFormBatches(rows) {
  const parsed = []
  const errors = {}

  rows.forEach((row) => {
    const name = String(row.name || '').trim()
    const mrpRaw = String(row.mrp ?? '').trim()
    const costRaw = String(row.costPrice ?? '').trim()
    const sellRaw = String(row.sellingPrice ?? row.price ?? '').trim()
    const stockRaw = String(row.stock ?? '').trim()
    const mfgRaw = String(row.manufacturedDate ?? '').trim()
    const expRaw = String(row.expiryDate ?? '').trim()
    const fssaiRaw = String(row.fssai ?? '').trim()

    if (!name && !mrpRaw && !costRaw && !sellRaw && !stockRaw && !mfgRaw && !expRaw && !fssaiRaw) return

    if (!name) {
      errors[`batch-${row.id}-name`] = 'Batch name is required'
    }

    const mrp = mrpRaw === '' ? 0 : parseFloat(mrpRaw)
    if (mrpRaw !== '' && (isNaN(mrp) || mrp < 0)) {
      errors[`batch-${row.id}-mrp`] = 'Enter a valid MRP'
    }

    const costPrice = costRaw === '' ? 0 : parseFloat(costRaw)
    if (costRaw !== '' && (isNaN(costPrice) || costPrice < 0)) {
      errors[`batch-${row.id}-costPrice`] = 'Enter a valid cost price'
    }

    const sellingPrice = sellRaw === '' ? NaN : parseFloat(sellRaw)
    if (!sellRaw || isNaN(sellingPrice) || sellingPrice < 0) {
      errors[`batch-${row.id}-sellingPrice`] = 'Enter a valid selling price'
    }

    const stock = stockRaw === '' ? 0 : parseFloat(stockRaw)
    if (stockRaw !== '' && (!Number.isFinite(stock) || stock < 0)) {
      errors[`batch-${row.id}-stock`] = 'Enter a valid quantity'
    }

    const manufacturedDate = normalizeDateValue(mfgRaw)
    if (mfgRaw && !manufacturedDate) {
      errors[`batch-${row.id}-manufacturedDate`] = 'Enter a valid manufactured date'
    }

    const expiryDate = expRaw

    parsed.push({
      id: row.id || createBatchId(),
      name,
      mrp: isNaN(mrp) ? 0 : mrp,
      costPrice: isNaN(costPrice) ? 0 : costPrice,
      sellingPrice: isNaN(sellingPrice) ? 0 : sellingPrice,
      stock: Number.isFinite(stock) ? parseStock(stock) : 0,
      manufacturedDate,
      expiryDate,
      fssai: fssaiRaw,
    })
  })

  if (parsed.length === 0) {
    errors.batches = 'Add at least one batch with name, prices, and quantity'
  }

  return { batches: parsed, errors }
}

export function applyBatchesToProduct(product, batches) {
  const totalStock = batches.reduce((sum, b) => sum + b.stock, 0)
  const sellingPrices = batches.map((b) => b.sellingPrice)
  const primaryPrice = sellingPrices.length === 1 ? sellingPrices[0] : Math.min(...sellingPrices)
  const batchLabel =
    batches.length === 1
      ? batches[0].name
      : batches.map((b) => b.name).filter(Boolean).join(', ')

  const normalizedBatches = batches.map((b) => ({
    ...b,
    price: b.sellingPrice,
  }))

  return {
    ...product,
    batches: normalizedBatches,
    stock: totalStock,
    price: primaryPrice,
    mrp: batches[0]?.mrp ?? primaryPrice,
    batch: batchLabel,
  }
}

/** Product shaped for POS cart from a specific batch line. */
export function productForBatch(product, batch, batchesCatalog = []) {
  const base = applyBatchesToProduct(product, getProductBatches(product, batchesCatalog))
  const sellingPrice = batch.sellingPrice ?? batch.price
  return {
    ...base,
    price: sellingPrice,
    stock: batch.stock,
    batch: batch.name,
    productBatchId: batch.id,
    mrp: batch.mrp,
    costPrice: batch.costPrice,
  }
}

/** Build first batch row from barcode lookup prefill. */
export function batchRowFromLookup(prefill) {
  return emptyBatchRow({
    name: 'batch 1',
    mrp: prefill.mrp ? String(prefill.mrp) : '',
    costPrice: prefill.costPrice ? String(prefill.costPrice) : '',
    sellingPrice: prefill.sellingPrice ? String(prefill.sellingPrice) : '',
    stock: '',
  })
}
