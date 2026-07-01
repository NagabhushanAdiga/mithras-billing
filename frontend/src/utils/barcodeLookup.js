/**
 * Look up packaged product info from a public barcode database (Open Food Facts).
 * Works for many retail barcodes (e.g. Maggi, groceries). Fill cost price manually.
 */
export async function lookupBarcodeProduct(barcode) {
  const code = String(barcode || '').trim()
  if (!code || code.length < 8) return null

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`,
      { headers: { Accept: 'application/json' } }
    )
    if (!res.ok) return null

    const data = await res.json()
    if (data.status !== 1 || !data.product) return null

    const p = data.product
    const name = String(p.product_name || p.generic_name || p.brands || '').trim()
    if (!name) return null

    const mrp = pickPrice(p)
    const image = p.image_front_url || p.image_url || p.image_front_small_url || ''

    return {
      barcode: code,
      name,
      image: image || undefined,
      mrp,
      sellingPrice: mrp,
      costPrice: 0,
      categoryHint: p.categories || '',
    }
  } catch {
    return null
  }
}

function pickPrice(product) {
  const candidates = [
    product.price,
    product.nutriments?.['energy-kcal_100g'],
  ]
  for (const raw of candidates) {
    const n = Number(raw)
    if (Number.isFinite(n) && n > 0) return n
  }
  return 0
}
