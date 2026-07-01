import { useEffect } from 'react'
import { HiOutlinePrinter, HiOutlineX, HiOutlineDownload } from 'react-icons/hi'
import Button from '../common/Button'
import InvoicePreview from './InvoicePreview'
import { generateInvoicePdf, printInvoiceHtml, buildInvoicePreviewHtml } from '../../utils/generateInvoicePdf'
import { usePendingChanges } from '../../hooks/usePendingChanges'

export default function ReceiptBillModal({
  open,
  order,
  settings,
  onClose,
}) {
  const { pendingChanges, patchPendingChanges } = usePendingChanges({ htmlCache: '' })
  const { htmlCache } = pendingChanges

  useEffect(() => {
    if (!open || !order) return
    let cancelled = false
    buildInvoicePreviewHtml(settings, order).then((html) => {
      if (!cancelled) patchPendingChanges({ htmlCache: html })
    })
    return () => {
      cancelled = true
    }
  }, [open, order, settings, patchPendingChanges])

  useEffect(() => {
    if (!open) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  const handlePrint = async () => {
    if (htmlCache) {
      printInvoiceHtml(htmlCache, order?.id ? `Bill ${order.id}` : 'Bill')
      return
    }
    const html = await buildInvoicePreviewHtml(settings, order)
    printInvoiceHtml(html, order?.id ? `Bill ${order.id}` : 'Bill')
  }

  const handleDownload = async () => {
    await generateInvoicePdf(settings, order)
  }

  if (!open || !order) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Invoice"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl flex flex-col max-h-[94vh] bg-white rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between gap-2 px-4 sm:px-5 py-4 border-b border-slate-200 bg-white">
          <div>
            <p className="text-slate-900 text-sm font-semibold">Review invoice</p>
            <p className="text-slate-500 text-xs mt-0.5">Confirm details, then print or download PDF</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto bg-slate-100 p-3 sm:p-5">
          <InvoicePreview settings={settings} order={order} />
        </div>

        <div className="shrink-0 flex flex-wrap gap-2 p-4 sm:p-5 border-t border-slate-200 bg-white">
          <Button type="button" className="flex-1 min-w-[120px]" onClick={handlePrint}>
            <HiOutlinePrinter className="w-4 h-4" />
            Print bill
          </Button>
          <Button type="button" variant="outline" className="flex-1 min-w-[120px]" onClick={handleDownload}>
            <HiOutlineDownload className="w-4 h-4" />
            Download PDF
          </Button>
          <Button type="button" variant="outline" className="flex-1 min-w-[120px]" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
