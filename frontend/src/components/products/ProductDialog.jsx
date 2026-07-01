import { useEffect, useRef } from 'react'
import { HiOutlineCube, HiOutlineX } from 'react-icons/hi'
import Card from '../common/Card'
import ProductForm, { PRODUCT_FORM_ID } from './ProductForm'
import FormActions from '../common/FormActions'
import { useAsyncAction, delay } from '../../hooks/useAsyncAction'

export default function ProductDialog({ open, product, prefill, onSubmit, onCancel }) {
  const dialogRef = useRef(null)
  const { loading, run } = useAsyncAction()
  const isEditing = Boolean(product)

  useEffect(() => {
    if (!open) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onCancel])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open || !dialogRef.current) return
    const firstField = dialogRef.current.querySelector(
      'form input:not([type="file"]):not([readonly]):not([type="hidden"]), form select'
    )
    if (firstField) {
      requestAnimationFrame(() => firstField.focus())
    }
  }, [open, product])

  const handleSubmit = (data) => {
    run(async () => {
      await delay(350)
      onSubmit?.(data)
    })
  }

  if (!open) return null

  const title = isEditing ? 'Edit product' : 'Add product'
  const subtitle = isEditing
    ? 'Update batches, stock, and category. Name and barcode cannot be changed.'
    : 'Barcode is generated automatically. Add one or more batches below.'
  const primaryLabel = isEditing ? 'Update product' : 'Add product'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-dialog-title"
    >
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-4xl max-h-[min(92dvh,820px)] sm:max-h-[min(90dvh,820px)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <Card
          className="flex flex-col min-h-0 max-h-[inherit] shadow-2xl !overflow-hidden rounded-t-2xl sm:rounded-md border-0 sm:border"
          showAccent={false}
        >
          <div className="shrink-0 px-4 py-4 sm:px-6 sm:py-5 border-b border-orange-200/80 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/20 shrink-0">
                <HiOutlineCube className="w-5 h-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="product-dialog-title" className="text-base sm:text-lg font-bold leading-snug">
                  {title}
                </h2>
                <p className="text-amber-50/90 text-xs sm:text-sm mt-0.5 leading-relaxed">
                  {subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="shrink-0 p-2 -mr-1 rounded-lg text-white/90 hover:bg-white/15 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6">
            <ProductForm
              product={product}
              prefill={prefill}
              onSubmit={handleSubmit}
              onCancel={onCancel}
              inSlider
              formId={PRODUCT_FORM_ID}
            />
          </div>

          <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-200 bg-slate-50/80 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-4">
            <FormActions
              onCancel={onCancel}
              primaryLabel={primaryLabel}
              primaryForm={PRODUCT_FORM_ID}
              loading={loading}
              disabled={loading}
              className="flex-col-reverse sm:flex-row"
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
