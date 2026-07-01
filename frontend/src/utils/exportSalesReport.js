import * as XLSX from 'xlsx'
import { getProductStock } from './billing'

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function formatExportDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString()
}

function formatFileDate(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function filterOrders(orders, { dateFrom = '', dateTo = '', productQuery = '', categoryId = '' } = {}, products = []) {
  const q = productQuery.trim().toLowerCase()
  const from = dateFrom ? startOfDay(dateFrom) : null
  const to = dateTo ? endOfDay(dateTo) : null

  const productByBarcode = Object.fromEntries(products.map((p) => [p.barcode, p]))

  return orders.filter((order) => {
    const orderDate = new Date(order.date)
    if (from && orderDate < from) return false
    if (to && orderDate > to) return false

    if (!q && !categoryId) return true

    return order.items?.some((item) => {
      const product = productByBarcode[item.barcode]
      const matchSearch =
        !q ||
        item.name?.toLowerCase().includes(q) ||
        item.barcode?.includes(productQuery.trim())
      const matchCategory = !categoryId || product?.groupId === categoryId
      return matchSearch && matchCategory
    })
  })
}

function stockForProduct(products, barcode) {
  const product = products.find((p) => p.barcode === barcode)
  return product ? getProductStock(product) : null
}

function categoryForProduct(products, barcode) {
  return products.find((p) => p.barcode === barcode)?.category || ''
}

/**
 * One row per sold line (order item).
 */
export function buildSalesDetailRows(orders, products, filters = {}) {
  const filtered = filterOrders(orders, filters, products)
  const soldInPeriodByBarcode = {}

  filtered.forEach((order) => {
    order.items?.forEach((item) => {
      const product = products.find((p) => p.barcode === item.barcode)
      const q = filters.productQuery?.trim().toLowerCase() || ''
      const matchSearch =
        !q ||
        item.name?.toLowerCase().includes(q) ||
        item.barcode?.includes(filters.productQuery?.trim() || '')
      const matchCategory = !filters.categoryId || product?.groupId === filters.categoryId
      if (!matchSearch || !matchCategory) return
      const key = item.barcode || item.name
      soldInPeriodByBarcode[key] = (soldInPeriodByBarcode[key] || 0) + (Number(item.qty) || 0)
    })
  })

  const rows = []

  filtered.forEach((order) => {
    order.items?.forEach((item) => {
      const product = products.find((p) => p.barcode === item.barcode)
      const q = filters.productQuery?.trim().toLowerCase() || ''
      const matchSearch =
        !q ||
        item.name?.toLowerCase().includes(q) ||
        item.barcode?.includes(filters.productQuery?.trim() || '')
      const matchCategory = !filters.categoryId || product?.groupId === filters.categoryId
      if (!matchSearch || !matchCategory) return

      const remainingStock = stockForProduct(products, item.barcode)
      const soldQty = Number(item.qty) || 0
      const key = item.barcode || item.name
      const soldInPeriod = soldInPeriodByBarcode[key] || soldQty
      const totalStock =
        remainingStock != null ? remainingStock + soldInPeriod : ''

      rows.push({
        'Product Sold': item.name || '',
        Barcode: item.barcode || '',
        Category: categoryForProduct(products, item.barcode),
        'Sold Date': formatExportDate(order.date),
        _sortDate: order.date,
        'Order ID': order.id || '',
        'Sold Items': soldQty,
        'Unit Price': Number(item.price) || 0,
        'Line Total': Number(item.lineTotal ?? item.price * soldQty) || 0,
        'Total Stock': totalStock,
        'Remaining Stock': remainingStock ?? '',
      })
    })
  })

  return rows
    .sort((a, b) => new Date(b._sortDate) - new Date(a._sortDate))
    .map(({ _sortDate, ...row }) => row)
}

/**
 * Aggregated by product within the filtered period.
 */
export function buildSalesSummaryRows(orders, products, filters = {}) {
  const detail = buildSalesDetailRows(orders, products, filters)
  const byBarcode = {}

  detail.forEach((row) => {
    const key = row.Barcode || row['Product Sold']
    if (!byBarcode[key]) {
      const remaining = row['Remaining Stock'] === '' ? null : Number(row['Remaining Stock'])
      const sold = row['Sold Items']
      byBarcode[key] = {
        'Product Sold': row['Product Sold'],
        Barcode: row.Barcode,
        Category: row.Category,
        'Last Sold Date': row['Sold Date'],
        'Sold Items': 0,
        'Total Stock': remaining != null ? remaining + sold : '',
        'Remaining Stock': row['Remaining Stock'],
      }
    }
    byBarcode[key]['Sold Items'] += row['Sold Items']
    if (new Date(row['Sold Date']) > new Date(byBarcode[key]['Last Sold Date'])) {
      byBarcode[key]['Last Sold Date'] = row['Sold Date']
    }
    const remaining = row['Remaining Stock'] === '' ? null : Number(row['Remaining Stock'])
    if (remaining != null) {
      byBarcode[key]['Total Stock'] = remaining + byBarcode[key]['Sold Items']
      byBarcode[key]['Remaining Stock'] = remaining
    }
  })

  return Object.values(byBarcode).sort((a, b) => b['Sold Items'] - a['Sold Items'])
}

export function buildFilteredStats(orders, products, filters = {}) {
  const filtered = filterOrders(orders, filters, products)
  let totalSales = 0
  let totalSoldItems = 0
  const productCount = {}

  filtered.forEach((order) => {
    totalSales += Number(order.total) || 0
    order.items?.forEach((item) => {
      const product = products.find((p) => p.barcode === item.barcode)
      const q = filters.productQuery?.trim().toLowerCase() || ''
      const matchSearch =
        !q ||
        item.name?.toLowerCase().includes(q) ||
        item.barcode?.includes(filters.productQuery?.trim() || '')
      const matchCategory = !filters.categoryId || product?.groupId === filters.categoryId
      if (!matchSearch || !matchCategory) return

      totalSoldItems += Number(item.qty) || 0
      const key = item.barcode || item.name
      productCount[key] = (productCount[key] || 0) + (Number(item.qty) || 0)
    })
  })

  const topProducts = Object.entries(productCount)
    .map(([key, qty]) => {
      const product = products.find((p) => p.barcode === key)
      return { name: product?.name || key, qty }
    })
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10)

  return {
    orderCount: filtered.length,
    totalSales,
    totalSoldItems,
    topProducts,
  }
}

export function exportSalesReportExcel(orders, products, filters = {}, storeMeta = {}) {
  const {
    storeName = 'Store',
    storeAddress = '',
    storeGstin = '',
    storeWebsite = '',
  } = storeMeta
  const detailRows = buildSalesDetailRows(orders, products, filters)
  const summaryRows = buildSalesSummaryRows(orders, products, filters)

  if (detailRows.length === 0) {
    throw new Error('No sales data to export for the selected filters.')
  }

  const detailSheet = XLSX.utils.json_to_sheet(detailRows)
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows)

  const metaRows = [
    { Field: 'Store', Value: storeName },
    ...(storeAddress ? [{ Field: 'Address', Value: storeAddress }] : []),
    ...(storeGstin ? [{ Field: 'GSTIN', Value: storeGstin }] : []),
    ...(storeWebsite ? [{ Field: 'Website', Value: storeWebsite }] : []),
    { Field: 'Exported At', Value: formatExportDate(new Date().toISOString()) },
    { Field: 'Date From', Value: filters.dateFrom || 'All' },
    { Field: 'Date To', Value: filters.dateTo || 'All' },
    { Field: 'Product Filter', Value: filters.productQuery?.trim() || 'All' },
    { Field: 'Total Orders', Value: filterOrders(orders, filters, products).length },
    { Field: 'Total Sold Items', Value: detailRows.reduce((s, r) => s + r['Sold Items'], 0) },
  ]
  const metaSheet = XLSX.utils.json_to_sheet(metaRows)

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'By Product')
  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Sales Detail')
  XLSX.utils.book_append_sheet(workbook, metaSheet, 'Report Info')

  const filename = `sales-report-${formatFileDate()}.xlsx`
  XLSX.writeFile(workbook, filename)
  return filename
}
