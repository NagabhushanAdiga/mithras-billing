import { HiOutlineDocumentText, HiOutlineTrash } from 'react-icons/hi'
import Card from '../common/Card'
import Button from '../common/Button'
import Input from '../common/Input'

export default function PosSummaryPanel({
  itemCount,
  totalQty,
  grossSubtotal,
  discountTotal,
  discountApplied = 0,
  subtotal,
  total,
  totalBeforeBillDiscount,
  billDiscount,
  billDiscountType = 'amount',
  billDiscountAmount = 0,
  billDiscountEnabled = false,
  billDiscountError = '',
  onBillDiscountChange,
  onBillDiscountTypeChange,
  currency,
  discountEnabled,
  onGenerateBill,
  onRequestClearCart,
  billLoading = false,
}) {
  const format = (n) => `${currency}${Number(n).toFixed(2)}`
  const hasBillDiscount = billDiscountAmount > 0

  return (
    <div className="sticky top-4 space-y-4">
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="rounded-md bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 text-white p-5 sm:p-6 shadow-xl shadow-fuchsia-500/30 ring-2 ring-white/20">
          <p className="text-fuchsia-100 text-xs font-bold uppercase tracking-wider">Bill total</p>
          <p className="text-3xl sm:text-4xl font-extrabold mt-1 tracking-tight text-white drop-shadow-sm">
            {format(total)}
          </p>
          {billDiscountEnabled && hasBillDiscount && (
            <p className="text-fuchsia-100/90 text-sm mt-1 line-through">{format(totalBeforeBillDiscount)}</p>
          )}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/25 text-sm">
            <div>
              <p className="text-fuchsia-200 text-xs">Items</p>
              <p className="font-bold text-white mt-0.5">
                {itemCount}{' '}
                <span className="font-normal text-fuchsia-100">({totalQty} units)</span>
              </p>
            </div>
            {discountEnabled && discountTotal > 0 && (
              <div>
                <p className="text-fuchsia-200 text-xs">Savings vs MRP</p>
                <p className="font-bold text-emerald-200 mt-0.5">{format(discountTotal)}</p>
              </div>
            )}
            {billDiscountEnabled && hasBillDiscount && (
              <div>
                <p className="text-fuchsia-200 text-xs">Bill discount</p>
                <p className="font-bold text-emerald-200 mt-0.5">−{format(billDiscountAmount)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-md bg-white/95 border-2 border-violet-100 p-4 sm:p-5 space-y-3 shadow-lg shadow-violet-100/50 text-sm">
          {billDiscountEnabled && (
            <div className="rounded-md border border-dashed border-violet-200 bg-violet-50/40 p-3 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
                Bill discount <span className="font-normal normal-case text-slate-400">(optional)</span>
              </p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  step={billDiscountType === 'percent' ? '1' : '0.01'}
                  max={billDiscountType === 'percent' ? '100' : undefined}
                  value={billDiscount}
                  onChange={(e) => onBillDiscountChange?.(e.target.value)}
                  placeholder={billDiscountType === 'percent' ? '0' : '0.00'}
                  error={billDiscountError}
                  className="flex-1 min-w-0"
                />
                <select
                  value={billDiscountType}
                  onChange={(e) => onBillDiscountTypeChange?.(e.target.value)}
                  className="field-select !w-[5.5rem] shrink-0 !py-2.5"
                  aria-label="Bill discount type"
                >
                  <option value="amount">{currency}</option>
                  <option value="percent">%</option>
                </select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-800">{format(grossSubtotal)}</span>
            </div>
            {discountEnabled && discountTotal > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Savings vs MRP</span>
                <span className="font-semibold">{format(discountTotal)}</span>
              </div>
            )}
            {discountEnabled && discountApplied > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Item discounts</span>
                <span className="font-semibold">−{format(discountApplied)}</span>
              </div>
            )}
            {discountEnabled && discountApplied > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>After item discounts</span>
                <span className="font-semibold text-slate-800">{format(subtotal)}</span>
              </div>
            )}
            {billDiscountEnabled && hasBillDiscount && (
              <div className="flex justify-between text-emerald-700">
                <span>Bill discount</span>
                <span className="font-semibold">−{format(billDiscountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-violet-100 font-bold text-slate-900">
              <span>Total</span>
              <span className="text-fuchsia-600">{format(total)}</span>
            </div>
          </div>
        </div>

        <Button
          type="button"
          className="w-full py-3.5 text-base"
          disabled={itemCount === 0 || billLoading || Boolean(billDiscountError)}
          loading={billLoading}
          onClick={onGenerateBill}
        >
          <HiOutlineDocumentText className="w-5 h-5 mr-2 inline" />
          Generate bill
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={itemCount === 0}
          onClick={onRequestClearCart}
        >
          <HiOutlineTrash className="w-4 h-4 mr-1.5 inline" />
          Clear bill
        </Button>
      </Card>
    </div>
  )
}
