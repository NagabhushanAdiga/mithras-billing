import * as XLSX from 'xlsx'
import { getProductStock } from './billing'
import { formatBatchSummary } from './productBatches'
import { exportAuditLogExcel } from './exportAuditLog'

function formatFileDate(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function formatExportDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString()
}

function downloadWorkbook(workbook, filename) {
  XLSX.writeFile(workbook, filename)
  return filename
}

function appendMetaSheet(workbook, metaRows) {
  const metaSheet = XLSX.utils.json_to_sheet(metaRows)
  XLSX.utils.book_append_sheet(workbook, metaSheet, 'Export Info')
}

function baseMeta(storeMeta = {}, extra = []) {
  return [
    { Field: 'Store', Value: storeMeta.storeName || 'Store' },
    { Field: 'Exported At', Value: formatExportDate(new Date().toISOString()) },
    ...extra,
  ]
}

function assertHasData(rows, message) {
  if (!rows.length) {
    throw new Error(message)
  }
}

export function exportProductsExcel(products, storeMeta = {}) {
  assertHasData(products, 'No products to export.')

  const rows = products.map((p) => ({
    ID: p.id,
    Barcode: p.barcode,
    Name: p.name,
    Category: p.category || '',
    Subcategory: p.subcategory || '',
    HSN: p.hsn || '',
    'GST %': Number(p.gst) || 0,
    'Selling Price': Number(p.price) || 0,
    MRP: p.mrp ?? '',
    'Cost Price': p.costPrice ?? '',
    Discount: Number(p.discount) || 0,
    Stock: getProductStock(p),
    Batch: p.batch || formatBatchSummary(p) || '',
    Image: p.image || '',
  }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Products')
  appendMetaSheet(workbook, baseMeta(storeMeta, [{ Field: 'Total Products', Value: rows.length }]))

  return downloadWorkbook(workbook, `products-${formatFileDate()}.xlsx`)
}

export function exportCategoriesExcel(groups, storeMeta = {}) {
  assertHasData(groups, 'No categories to export.')

  const categoryRows = groups.map((g) => ({
    'Group ID': g.id,
    'Group Name': g.name,
    'Subcategory Count': g.subcategories?.length || 0,
  }))

  const subcategoryRows = []
  groups.forEach((g) => {
    ;(g.subcategories || []).forEach((s) => {
      subcategoryRows.push({
        'Group ID': g.id,
        'Group Name': g.name,
        'Subcategory ID': s.id,
        'Subcategory Name': s.name,
      })
    })
  })

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(categoryRows), 'Categories')
  if (subcategoryRows.length) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(subcategoryRows), 'Subcategories')
  }
  appendMetaSheet(workbook, baseMeta(storeMeta, [
    { Field: 'Categories', Value: categoryRows.length },
    { Field: 'Subcategories', Value: subcategoryRows.length },
  ]))

  return downloadWorkbook(workbook, `categories-${formatFileDate()}.xlsx`)
}

export function exportBatchesExcel(batches, storeMeta = {}) {
  assertHasData(batches, 'No batches to export.')

  const rows = batches.map((b) => ({
    ID: b.id,
    Name: b.name,
  }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Batches')
  appendMetaSheet(workbook, baseMeta(storeMeta, [{ Field: 'Total Batches', Value: rows.length }]))

  return downloadWorkbook(workbook, `batches-${formatFileDate()}.xlsx`)
}

export function exportOrdersExcel(orders, storeMeta = {}) {
  assertHasData(orders, 'No bills or orders to export.')

  const sorted = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date))

  const billRows = sorted.map((o) => ({
    'Bill ID': o.id,
    Date: formatExportDate(o.date),
    Customer: o.customerName || '',
    Mobile: o.customerMobile || '',
    Biller: o.createdBy?.name || o.createdBy?.username || '',
    Items: o.items?.length || 0,
    Subtotal: Number(o.subtotal) || 0,
    Tax: Number(o.tax) || 0,
    'Bill Discount': Number(o.billDiscountAmount) || 0,
    Total: Number(o.total) || 0,
  }))

  const lineRows = []
  sorted.forEach((o) => {
    ;(o.items || []).forEach((item) => {
      lineRows.push({
        'Bill ID': o.id,
        Date: formatExportDate(o.date),
        Product: item.name || '',
        Barcode: item.barcode || '',
        Qty: Number(item.qty) || 0,
        'Unit Price': Number(item.price) || 0,
        'Line Total': Number(item.lineTotal ?? (Number(item.price) || 0) * (Number(item.qty) || 0)) || 0,
      })
    })
  })

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(billRows), 'Bills')
  if (lineRows.length) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(lineRows), 'Line Items')
  }
  appendMetaSheet(workbook, baseMeta(storeMeta, [
    { Field: 'Total Bills', Value: billRows.length },
    { Field: 'Total Line Items', Value: lineRows.length },
  ]))

  return downloadWorkbook(workbook, `bills-orders-${formatFileDate()}.xlsx`)
}

export function exportSupportTicketsExcel(tickets, storeMeta = {}) {
  assertHasData(tickets, 'No support tickets to export.')

  const rows = tickets.map((t) => ({
    'Ticket No': t.ticketNo || t.id,
    Status: t.status || '',
    Category: t.category || '',
    Priority: t.priority || '',
    Subject: t.subject || '',
    Description: t.description || '',
    'Created At': formatExportDate(t.createdAt),
    'Updated At': formatExportDate(t.updatedAt),
  }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Support Tickets')
  appendMetaSheet(workbook, baseMeta(storeMeta, [{ Field: 'Total Tickets', Value: rows.length }]))

  return downloadWorkbook(workbook, `support-tickets-${formatFileDate()}.xlsx`)
}

export function exportSettingsExcel(settings, storeMeta = {}) {
  const rows = [
    { Setting: 'Store Name', Value: settings?.storeName ?? '' },
    { Setting: 'Address', Value: settings?.storeAddress ?? '' },
    { Setting: 'GSTIN', Value: settings?.storeGstin ?? '' },
    { Setting: 'Website', Value: settings?.storeWebsite ?? '' },
    { Setting: 'UPI ID', Value: settings?.storeUpiId ?? '' },
    { Setting: 'Tax Rate (%)', Value: settings?.taxRate ?? '' },
    { Setting: 'Currency', Value: settings?.currency ?? '' },
    { Setting: 'Discount Enabled', Value: settings?.discountEnabled ? 'Yes' : 'No' },
    { Setting: 'Discount Type', Value: settings?.discountType ?? '' },
    { Setting: 'Max Discount (%)', Value: settings?.maxDiscountPercent ?? '' },
    { Setting: 'Bill Discount Enabled', Value: settings?.billDiscountEnabled ? 'Yes' : 'No' },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Store Settings')
  appendMetaSheet(workbook, baseMeta(storeMeta))

  return downloadWorkbook(workbook, `store-settings-${formatFileDate()}.xlsx`)
}

export { exportAuditLogExcel }

export const STORE_EXPORT_HANDLERS = {
  products: exportProductsExcel,
  categories: exportCategoriesExcel,
  batches: exportBatchesExcel,
  orders: exportOrdersExcel,
  supportTickets: exportSupportTicketsExcel,
  auditLog: (entries, storeMeta) => exportAuditLogExcel(entries, {}, storeMeta),
  settings: exportSettingsExcel,
}
