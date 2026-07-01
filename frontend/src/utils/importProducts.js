import * as XLSX from 'xlsx'

const COLUMN_ALIASES = {
  barcode: ['barcode', 'bar code', 'sku', 'code', 'product code'],
  name: ['name', 'product name', 'product', 'item', 'item name', 'description'],
  price: ['price', 'mrp', 'rate', 'amount', 'selling price', 'sale price'],
  group: ['group', 'category', 'group name', 'product group'],
  discount: ['discount', 'discount %', 'discount percent', 'off'],
  hsn: ['hsn', 'hsn code', 'sac', 'sac code', 'gst hsn'],
  gst: ['gst', 'gst %', 'gst rate', 'tax', 'tax %', 'tax rate', 'igst', 'cgst'],
}

function normalizeKey(key) {
  return String(key || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function pickValue(row, aliases) {
  for (const [rawKey, value] of Object.entries(row)) {
    const normalized = normalizeKey(rawKey)
    if (aliases.includes(normalized)) return value
  }
  return ''
}

function parsePrice(value) {
  if (value === '' || value == null) return NaN
  const cleaned = String(value).replace(/[^\d.-]/g, '')
  return parseFloat(cleaned)
}

export function parseProductRows(rows) {
  const parsed = []
  const errors = []

  rows.forEach((row, index) => {
    const rowNum = index + 2
    const barcode = String(pickValue(row, COLUMN_ALIASES.barcode)).trim()
    const name = String(pickValue(row, COLUMN_ALIASES.name)).trim()
    const price = parsePrice(pickValue(row, COLUMN_ALIASES.price))
    const group = String(pickValue(row, COLUMN_ALIASES.group)).trim()
    const discountRaw = pickValue(row, COLUMN_ALIASES.discount)
    const discount = discountRaw === '' || discountRaw == null ? 0 : Number(discountRaw)
    const hsn = String(pickValue(row, COLUMN_ALIASES.hsn)).trim().replace(/\s/g, '')
    const gstRaw = pickValue(row, COLUMN_ALIASES.gst)
    const gst = gstRaw === '' || gstRaw == null ? undefined : Number(gstRaw)

    if (!barcode && !name && !pickValue(row, COLUMN_ALIASES.price)) return

    if (!barcode) {
      errors.push(`Row ${rowNum}: missing barcode`)
      return
    }
    if (!name) {
      errors.push(`Row ${rowNum}: missing product name`)
      return
    }
    if (isNaN(price) || price < 0) {
      errors.push(`Row ${rowNum}: invalid price for "${name}"`)
      return
    }

    if (hsn && !/^\d{4,8}$/.test(hsn)) {
      errors.push(`Row ${rowNum}: invalid HSN for "${name}" (use 4–8 digits)`)
      return
    }

    if (gstRaw !== '' && gstRaw != null && (isNaN(gst) || gst < 0 || gst > 100)) {
      errors.push(`Row ${rowNum}: invalid GST for "${name}" (use 0–100)`)
      return
    }

    parsed.push({
      barcode,
      name,
      price,
      group,
      discount: isNaN(discount) || discount < 0 ? 0 : discount,
      hsn,
      ...(gst !== undefined ? { gst } : {}),
    })
  })

  return { products: parsed, errors }
}

export function parseProductFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
          reject(new Error('The file has no sheets.'))
          return
        }
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        resolve(parseProductRows(rows))
      } catch {
        reject(new Error('Could not read this file. Use .xlsx, .xls, or .csv format.'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read the file.'))
    reader.readAsArrayBuffer(file)
  })
}

export function downloadProductTemplate() {
  const rows = [
    { Barcode: '8901234567890', Name: 'Rice 1kg', HSN: '1006', Price: 65, Category: 'Grocery', Discount: 0 },
    { Barcode: '8901234567891', Name: 'Dal 500g', HSN: '0713', Price: 120, Category: 'Grocery', Discount: 5 },
  ]
  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Products')
  XLSX.writeFile(workbook, 'product-import-template.xlsx')
}
