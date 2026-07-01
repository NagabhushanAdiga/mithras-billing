import { useEffect } from 'react'
import { HiOutlineX, HiOutlineArrowRight } from 'react-icons/hi'
import Button from '../common/Button'
import Card from '../common/Card'
import ProductImage from '../common/ProductImage'
import {
  formatQty,
  lineSavingsDisplay,
  lineTotalWithTax,
  resolveItemGstRate,
} from '../../utils/billing'

export default function BillReviewModal({
  open,
  items = [],
  currency = '₹',
  taxRate = 0,
  discountType = 'percent',
  maxDiscountPercent = 100,
  discountEnabled = false,
  billDiscountEnabled = false,
  grossSubtotal = 0,
  discountTotal = 0,
  discountApplied = 0,
  subtotal = 0,
  tax = 0,
  total = 0,
  totalBeforeBillDiscount = 0,
  billDiscountAmount = 0,
  onContinue,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onCancel])

  if (!open) return null

  const format = (n) => `${currency}${Number(n).toFixed(2)}`
  const totalQty = items.reduce((sum, i) => sum + Number(i.qty || 0), 0)

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bill-review-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="flex flex-col max-h-[90vh] shadow-2xl" showAccent={false}>
          <div className="shrink-0 flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-slate-100">
            <div>
              <h3 id="bill-review-title" className="text-lg font-bold text-slate-900">
                Review bill
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Check items and totals before customer details and printing.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="w-9 h-9 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
              aria-label="Close"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-auto p-5 sm:p-6">
            <div className="rounded-md border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-500 text-xs font-bold uppercase">
                  <tr>
                    <th className="px-3 py-2.5">Item</th>
                    <th className="px-3 py-2.5 text-right w-16">Qty</th>
                    <th className="px-3 py-2.5 text-right w-20">Rate</th>
                    <th className="px-3 py-2.5 text-right w-24">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const row = {
                      price: item.price,
                      qty: item.qty,
                      discount: item.discount || 0,
                      mrp: item.mrp,
                      gst: item.gst,
                    }
                    const lineAmt = lineTotalWithTax(row, taxRate, discountType, maxDiscountPercent)
                    const lineDisc = lineSavingsDisplay(row, discountType, maxDiscountPercent)
                    const itemGst = resolveItemGstRate(row, taxRate)

                    return (
                      <tr key={item.cartId || `${item.barcode}-${item.productBatchId}`} className="border-b border-slate-300 hover:bg-violet-50/40">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <ProductImage product={item} size="sm" />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono truncate">
                                {item.barcode}
                                {item.batch ? ` · ${item.batch}` : ''}
                              </p>
                              {(item.hsn || itemGst > 0) && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {item.hsn ? `HSN ${item.hsn}` : ''}
                                  {item.hsn && itemGst > 0 ? ' · ' : ''}
                                  {itemGst > 0 ? `GST ${itemGst}%` : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-700 tabular-nums">
                          {formatQty(item.qty)}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-600 tabular-nums">
                          {format(item.price)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <p className="font-bold text-slate-900 tabular-nums">{format(lineAmt)}</p>
                          {discountEnabled && lineDisc > 0 && (
                            <p className="text-[10px] text-emerald-600 tabular-nums">−{format(lineDisc)}</p>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-md bg-slate-50 border border-slate-100 px-4 py-3 text-sm space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Items / Qty</span>
                <span className="font-semibold">{items.length} / {formatQty(totalQty)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold">{format(grossSubtotal)}</span>
              </div>
              {discountEnabled && discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Savings vs MRP</span>
                  <span className="font-semibold">{format(discountTotal)}</span>
                </div>
              )}
              {discountEnabled && discountApplied > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Item discount</span>
                  <span className="font-semibold">−{format(discountApplied)}</span>
                </div>
              )}
              {(discountApplied > 0 || subtotal < grossSubtotal) && (
                <div className="flex justify-between text-slate-600">
                  <span>Taxable</span>
                  <span className="font-semibold">{format(subtotal)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>GST (included)</span>
                  <span className="font-semibold">{format(tax)}</span>
                </div>
              )}
              {billDiscountEnabled && billDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Bill discount</span>
                  <span className="font-semibold">−{format(billDiscountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-base text-slate-900">
                <span>Total</span>
                <span className="text-violet-700">{format(total)}</span>
              </div>
              {billDiscountEnabled && billDiscountAmount > 0 && totalBeforeBillDiscount !== total && (
                <p className="text-xs text-slate-400 text-right line-through">{format(totalBeforeBillDiscount)}</p>
              )}
            </div>
          </div>

          <div className="shrink-0 flex flex-col-reverse sm:flex-row gap-2 p-4 sm:p-5 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onCancel} className="sm:flex-1">
              Back to POS
            </Button>
            <Button type="button" onClick={onContinue} className="sm:flex-1">
              Continue
              <HiOutlineArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
