import { jsPDF } from 'jspdf'
import { buildInvoiceHtml } from './invoiceHtml'

function mountInvoiceHtml(html) {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-10000px'
  container.style.top = '0'
  container.style.width = '794px'
  container.style.background = '#ffffff'
  container.innerHTML = html
  document.body.appendChild(container)
  return container
}

async function renderInvoiceToPdf(settings, order) {
  const html = await buildInvoiceHtml(settings, order)
  const container = mountInvoiceHtml(html)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  try {
    await doc.html(container, {
      margin: [8, 10, 12, 10],
      autoPaging: 'text',
      width: 190,
      windowWidth: 794,
      html2canvas: { scale: 0.75, useCORS: true, logging: false },
    })
    return doc
  } finally {
    container.remove()
  }
}

export function printInvoiceHtml(html, title = 'Bill') {
  const printWindow = window.open('', '_blank', 'width=900,height=900')
  if (!printWindow) return false

  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      @page { margin: 12mm; size: A4; }
      body { margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    </style>
  </head>
  <body>${html}</body>
</html>`)
  printWindow.document.close()

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 350)
  }
  return true
}

/** Build invoice HTML for on-screen preview. */
export async function buildInvoicePreviewHtml(settings, order) {
  return buildInvoiceHtml(settings, order)
}

/** Download invoice as PDF (HTML-rendered, professional layout). */
export async function generateInvoicePdf(settings, order) {
  const doc = await renderInvoiceToPdf(settings, order)
  doc.save(`${order.id}.pdf`)
}

/** Open print dialog with the full HTML invoice. */
export async function generateInvoicePdfForPrint(settings, order) {
  const html = await buildInvoiceHtml(settings, order)
  const opened = printInvoiceHtml(html, `Bill ${order.id}`)
  if (!opened) {
    const doc = await renderInvoiceToPdf(settings, order)
    const url = doc.output('bloburl')
    window.open(url, '_blank')
  }
}
