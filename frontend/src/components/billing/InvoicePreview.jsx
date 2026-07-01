import { useEffect } from 'react'
import { buildInvoicePreviewHtml } from '../../utils/generateInvoicePdf'
import { usePendingChanges } from '../../hooks/usePendingChanges'

export default function InvoicePreview({ settings, order, className = '' }) {
  const { pendingChanges, patchPendingChanges } = usePendingChanges({ html: '', loading: true })
  const { html, loading } = pendingChanges

  useEffect(() => {
    let cancelled = false
    patchPendingChanges({ loading: true })
    buildInvoicePreviewHtml(settings, order)
      .then((content) => {
        if (!cancelled) {
          patchPendingChanges({ html: content, loading: false })
        }
      })
      .catch(() => {
        if (!cancelled) patchPendingChanges({ loading: false })
      })
    return () => {
      cancelled = true
    }
  }, [settings, order, patchPendingChanges])

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-16 text-slate-500 text-sm ${className}`}>
        Preparing invoice…
      </div>
    )
  }

  if (!html) {
    return (
      <div className={`flex items-center justify-center py-16 text-slate-500 text-sm ${className}`}>
        Could not load invoice preview.
      </div>
    )
  }

  return (
    <div
      className={`invoice-preview-root bg-white rounded-lg overflow-hidden shadow-inner border border-slate-200 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
