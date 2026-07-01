import {
  lineGross,
  lineSavingsDisplay,
  lineNet,
  lineTax,
  lineTaxableValue,
  formatQty,
  resolveItemGstRate,
} from './billing'

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function money(amount, currency = '₹') {
  return `${currency}${Number(amount || 0).toFixed(2)}`
}

function moneyPlain(amount) {
  return Number(amount || 0).toFixed(2)
}

function formatBillDateShort(iso) {
  const d = iso ? new Date(iso) : new Date()
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function twoWords(n) {
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ]
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const num = Math.floor(n)
  if (num < 20) return ones[num]
  if (num < 100) return `${tens[Math.floor(num / 10)]}${ones[num % 10] ? ` ${ones[num % 10]}` : ''}`
  return String(num)
}

function chunkToWords(n) {
  if (n === 0) return ''
  if (n < 100) return twoWords(n)
  if (n < 1000) {
    const h = Math.floor(n / 100)
    const r = n % 100
    return `${twoWords(h)} Hundred${r ? ` ${twoWords(r)}` : ''}`
  }
  return String(n)
}

/** Indian numbering — rupees only (paise rounded). */
export function amountInWordsINR(amount) {
  const total = Math.round(Number(amount || 0))
  if (!Number.isFinite(total) || total < 0) return 'Zero Rupees Only'
  if (total === 0) return 'Zero Rupees Only'

  const crore = Math.floor(total / 10000000)
  const lakh = Math.floor((total % 10000000) / 100000)
  const thousand = Math.floor((total % 100000) / 1000)
  const hundredRest = total % 1000

  const parts = []
  if (crore) parts.push(`${chunkToWords(crore)} Crore`)
  if (lakh) parts.push(`${chunkToWords(lakh)} Lakh`)
  if (thousand) parts.push(`${chunkToWords(thousand)} Thousand`)
  if (hundredRest) parts.push(chunkToWords(hundredRest))

  return `${parts.join(' ').trim()} Rupees Only`
}

function computeLineDetails(row, discountType, maxDiscountPercent, taxRate) {
  const itemRow = {
    price: row.price,
    qty: row.qty,
    discount: row.discount || 0,
    mrp: row.mrp,
    gst: row.gst,
  }
  const inclusive = lineNet(itemRow, discountType, maxDiscountPercent)
  const gstRate = resolveItemGstRate(itemRow, taxRate)
  const tax = lineTax(itemRow, taxRate, discountType, maxDiscountPercent)
  const taxable = lineTaxableValue(itemRow, taxRate, discountType, maxDiscountPercent)
  const cgstRate = gstRate / 2
  const sgstRate = gstRate / 2
  const cgst = tax / 2
  const sgst = tax / 2
  const total = inclusive
  const lineDisc =
    row.lineDiscount != null
      ? Number(row.lineDiscount)
      : lineSavingsDisplay(itemRow, discountType, maxDiscountPercent)

  return {
    itemRow,
    taxable,
    tax,
    gstRate,
    cgstRate,
    sgstRate,
    cgst,
    sgst,
    total,
    lineDisc,
    gross: lineGross(itemRow),
  }
}

function aggregateGstSummary(lines) {
  const map = new Map()
  for (const line of lines) {
    const key = String(line.gstRate)
    const bucket = map.get(key) || {
      gstRate: line.gstRate,
      cgstRate: line.cgstRate,
      sgstRate: line.sgstRate,
      taxable: 0,
      cgst: 0,
      sgst: 0,
      tax: 0,
    }
    bucket.taxable += line.taxable
    bucket.cgst += line.cgst
    bucket.sgst += line.sgst
    bucket.tax += line.tax
    map.set(key, bucket)
  }
  return [...map.values()].sort((a, b) => a.gstRate - b.gstRate)
}

const th =
  'padding:6px 5px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;border:1px solid #000;background:#f3f4f6;color:#111;'
const td =
  'padding:5px 5px;font-size:10px;border:1px solid #cbd5e1;vertical-align:top;color:#111;'
const tdR = `${td}text-align:right;white-space:nowrap;`

export async function buildInvoiceHtml(settings, order) {
  const {
    storeName = 'Store',
    storeAddress = '',
    storeGstin = '',
    storeWebsite = '',
    currency = '₹',
    discountType = 'percent',
    taxRate = 0,
    maxDiscountPercent = 100,
  } = settings

  const {
    id,
    date,
    items = [],
    grossSubtotal,
    discountTotal = 0,
    billDiscountAmount = 0,
    customerName = '',
    customerMobile = '',
    createdBy,
  } = order

  const billedBy = createdBy?.name || createdBy?.username || ''
  const lineDetails = items.map((row) =>
    computeLineDetails(row, discountType, maxDiscountPercent, taxRate)
  )

  const gross = grossSubtotal ?? lineDetails.reduce((s, l) => s + l.gross, 0)
  const disc = discountTotal ?? lineDetails.reduce((s, l) => s + l.lineDisc, 0)
  const taxableTotal = lineDetails.reduce((s, l) => s + l.taxable, 0)
  const totalCgst = lineDetails.reduce((s, l) => s + l.cgst, 0)
  const totalSgst = lineDetails.reduce((s, l) => s + l.sgst, 0)
  const totalTax = lineDetails.reduce((s, l) => s + l.tax, 0)
  const lineGrand = lineDetails.reduce((s, l) => s + l.total, 0)
  const grandTotal = Math.max(0, lineGrand - billDiscountAmount)
  const hasBillDiscount = billDiscountAmount > 0
  const hasDiscount = disc > 0
  const gstSummary = aggregateGstSummary(lineDetails)
  const totalQty = items.reduce((s, i) => s + Number(i.qty || 0), 0)

  const itemRows = items
    .map((row, index) => {
      const d = lineDetails[index]
      const batchLine = row.batch ? `<div style="font-size:9px;color:#64748b;">Batch: ${esc(row.batch)}</div>` : ''
      return `
        <tr>
          <td style="${tdR}width:28px;">${index + 1}</td>
          <td style="${td}">
            <div style="font-weight:600;">${esc(row.name)}</div>
            ${batchLine}
          </td>
          <td style="${tdR}font-family:monospace;font-size:9px;">${row.hsn ? esc(row.hsn) : '—'}</td>
          <td style="${tdR}">${formatQty(row.qty)}</td>
          <td style="${tdR}">${moneyPlain(row.price)}</td>
          ${hasDiscount ? `<td style="${tdR}color:#047857;">${d.lineDisc > 0 ? moneyPlain(d.lineDisc) : '—'}</td>` : ''}
          <td style="${tdR}">${moneyPlain(d.taxable)}</td>
          <td style="${tdR}">${d.gstRate > 0 ? `${d.gstRate}%` : '—'}</td>
          <td style="${tdR}">${d.cgst > 0 ? moneyPlain(d.cgst) : '—'}</td>
          <td style="${tdR}">${d.sgst > 0 ? moneyPlain(d.sgst) : '—'}</td>
          <td style="${tdR}font-weight:700;">${moneyPlain(d.total)}</td>
        </tr>`
    })
    .join('')

  const gstSummaryRows = gstSummary
    .map(
      (b) => `
        <tr>
          <td style="${tdR}">${b.gstRate > 0 ? `${b.gstRate}%` : 'Exempt'}</td>
          <td style="${tdR}">${moneyPlain(b.taxable)}</td>
          <td style="${tdR}">${b.cgstRate > 0 ? `${b.cgstRate}%` : '—'}</td>
          <td style="${tdR}">${moneyPlain(b.cgst)}</td>
          <td style="${tdR}">${b.sgstRate > 0 ? `${b.sgstRate}%` : '—'}</td>
          <td style="${tdR}">${moneyPlain(b.sgst)}</td>
          <td style="${tdR}font-weight:700;">${moneyPlain(b.tax)}</td>
        </tr>`
    )
    .join('')

  return `
<div style="font-family:Arial,'Helvetica Neue',sans-serif;color:#111;font-size:11px;line-height:1.4;width:100%;max-width:780px;margin:0 auto;background:#fff;border:2px solid #111;">
  <div style="padding:16px 20px 12px;text-align:center;border-bottom:2px solid #111;">
    <div style="font-size:18px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;">${esc(storeName)}</div>
    ${storeAddress ? `<div style="margin-top:6px;font-size:10px;color:#334155;white-space:pre-line;">${esc(storeAddress)}</div>` : ''}
    ${storeGstin ? `<div style="margin-top:8px;font-size:11px;font-weight:700;">GSTIN: <span style="font-family:monospace;letter-spacing:0.05em;">${esc(storeGstin)}</span></div>` : ''}
    ${storeWebsite ? `<div style="margin-top:4px;font-size:10px;color:#475569;">${esc(storeWebsite)}</div>` : ''}
    <div style="margin-top:10px;font-size:13px;font-weight:800;letter-spacing:0.12em;border-top:1px dashed #94a3b8;border-bottom:1px dashed #94a3b8;padding:6px 0;">TAX INVOICE</div>
  </div>

  <div style="padding:10px 20px;border-bottom:1px solid #cbd5e1;display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;font-size:10px;">
    <div>
      <div><strong>Bill No:</strong> <span style="font-family:monospace;">${esc(id)}</span></div>
      <div style="margin-top:3px;"><strong>Date:</strong> ${esc(formatBillDateShort(date))}</div>
      ${billedBy ? `<div style="margin-top:3px;"><strong>Cashier:</strong> ${esc(billedBy)}</div>` : ''}
    </div>
    <div style="text-align:right;">
      <div><strong>Items:</strong> ${items.length} &nbsp; <strong>Qty:</strong> ${formatQty(totalQty)}</div>
      ${customerName ? `<div style="margin-top:3px;"><strong>Customer:</strong> ${esc(customerName)}</div>` : ''}
      ${customerMobile ? `<div style="margin-top:3px;"><strong>Mobile:</strong> ${esc(customerMobile)}</div>` : ''}
    </div>
  </div>

  <div style="padding:12px 16px 0;">
    <table style="width:100%;border-collapse:collapse;border:1px solid #000;">
      <thead>
        <tr>
          <th style="${th}text-align:right;width:28px;">#</th>
          <th style="${th}text-align:left;">Particulars</th>
          <th style="${th}text-align:right;width:52px;">HSN</th>
          <th style="${th}text-align:right;width:40px;">Qty</th>
          <th style="${th}text-align:right;width:52px;">Rate</th>
          ${hasDiscount ? `<th style="${th}text-align:right;width:48px;">Disc</th>` : ''}
          <th style="${th}text-align:right;width:58px;">Taxable</th>
          <th style="${th}text-align:right;width:40px;">GST</th>
          <th style="${th}text-align:right;width:48px;">CGST</th>
          <th style="${th}text-align:right;width:48px;">SGST</th>
          <th style="${th}text-align:right;width:58px;">Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
  </div>

  <div style="padding:14px 16px 0;">
    <div style="font-size:10px;font-weight:800;text-transform:uppercase;margin-bottom:6px;letter-spacing:0.06em;">GST Summary (CGST + SGST)</div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #000;">
      <thead>
        <tr>
          <th style="${th}text-align:right;">GST %</th>
          <th style="${th}text-align:right;">Taxable Value</th>
          <th style="${th}text-align:right;">CGST %</th>
          <th style="${th}text-align:right;">CGST Amt</th>
          <th style="${th}text-align:right;">SGST %</th>
          <th style="${th}text-align:right;">SGST Amt</th>
          <th style="${th}text-align:right;">Total Tax</th>
        </tr>
      </thead>
      <tbody>
        ${gstSummaryRows || `<tr><td colspan="7" style="${td}text-align:center;color:#64748b;">No GST applicable</td></tr>`}
        <tr style="background:#f8fafc;font-weight:700;">
          <td style="${tdR}">Total</td>
          <td style="${tdR}">${moneyPlain(taxableTotal)}</td>
          <td style="${tdR}">—</td>
          <td style="${tdR}">${moneyPlain(totalCgst)}</td>
          <td style="${tdR}">—</td>
          <td style="${tdR}">${moneyPlain(totalSgst)}</td>
          <td style="${tdR}">${moneyPlain(totalTax)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div style="padding:14px 16px 16px;">
    <table style="width:100%;max-width:320px;margin-left:auto;border-collapse:collapse;font-size:11px;">
      <tr><td style="padding:4px 0;color:#475569;">Gross amount</td><td style="padding:4px 0;text-align:right;font-weight:600;">${money(gross, currency)}</td></tr>
      ${hasDiscount ? `<tr><td style="padding:4px 0;color:#047857;">Savings / discount</td><td style="padding:4px 0;text-align:right;font-weight:600;color:#047857;">−${money(disc, currency)}</td></tr>` : ''}
      <tr><td style="padding:4px 0;color:#475569;">Taxable value</td><td style="padding:4px 0;text-align:right;font-weight:600;">${money(taxableTotal, currency)}</td></tr>
      <tr><td style="padding:4px 0;color:#475569;">CGST <span style="font-size:9px;color:#64748b;">(incl.)</span></td><td style="padding:4px 0;text-align:right;font-weight:600;">${money(totalCgst, currency)}</td></tr>
      <tr><td style="padding:4px 0;color:#475569;">SGST <span style="font-size:9px;color:#64748b;">(incl.)</span></td><td style="padding:4px 0;text-align:right;font-weight:600;">${money(totalSgst, currency)}</td></tr>
      <tr><td style="padding:4px 0;color:#475569;">Total GST <span style="font-size:9px;color:#64748b;">(incl.)</span></td><td style="padding:4px 0;text-align:right;font-weight:600;">${money(totalTax, currency)}</td></tr>
      ${hasBillDiscount ? `<tr><td style="padding:4px 0;color:#047857;">Bill discount</td><td style="padding:4px 0;text-align:right;font-weight:600;color:#047857;">−${money(billDiscountAmount, currency)}</td></tr>` : ''}
      <tr>
        <td style="padding:10px 0 4px;border-top:2px solid #111;font-size:13px;font-weight:800;">Net amount</td>
        <td style="padding:10px 0 4px;border-top:2px solid #111;text-align:right;font-size:16px;font-weight:800;">${money(grandTotal, currency)}</td>
      </tr>
    </table>
    <p style="margin:12px 0 0;font-size:10px;color:#334155;font-style:italic;text-align:right;">
      Amount in words: <strong>${esc(amountInWordsINR(grandTotal))}</strong>
    </p>
  </div>

  <div style="border-top:1px dashed #94a3b8;padding:12px 20px;text-align:center;font-size:10px;color:#475569;">
    <div style="font-weight:700;color:#111;">Thank you! Please visit again.</div>
    <div style="margin-top:4px;">This is a computer-generated tax invoice.</div>
    <div style="margin-top:6px;font-size:9px;color:#64748b;">GST breakdown is shown for reference only. Selling prices are inclusive of GST; tax is not added again to the net amount.</div>
  </div>
</div>`
}
