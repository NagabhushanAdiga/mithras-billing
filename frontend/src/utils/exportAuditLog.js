import * as XLSX from 'xlsx'
import { formatAuditAction, formatAuditTime } from './auditLog'

function formatFileDate(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function actorLabel(actor) {
  if (!actor) return 'System'
  return actor.name || actor.username || 'Unknown'
}

export function exportAuditLogExcel(entries, filters = {}, storeMeta = {}) {
  if (!entries.length) {
    throw new Error('No audit entries to export for the selected filters.')
  }

  const rows = entries.map((entry) => ({
    Time: formatAuditTime(entry.at),
    User: actorLabel(entry.actor),
    Username: entry.actor?.username || '',
    Role: entry.actor?.role || '',
    Category: entry.category,
    Action: formatAuditAction(entry.action),
    Details: entry.details || '',
  }))

  const logSheet = XLSX.utils.json_to_sheet(rows)

  const metaRows = [
    { Field: 'Store', Value: storeMeta.storeName || 'Store' },
    { Field: 'Exported At', Value: new Date().toLocaleString() },
    { Field: 'Category Filter', Value: filters.categoryLabel || 'All activity' },
    { Field: 'Search', Value: filters.search?.trim() || 'All' },
    { Field: 'Entries Exported', Value: entries.length },
  ]
  const metaSheet = XLSX.utils.json_to_sheet(metaRows)

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, logSheet, 'Audit Log')
  XLSX.utils.book_append_sheet(workbook, metaSheet, 'Export Info')

  const filename = `audit-log-${formatFileDate()}.xlsx`
  XLSX.writeFile(workbook, filename)
  return filename
}
