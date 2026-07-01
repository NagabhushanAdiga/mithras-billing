import { useEffect } from 'react'
import { HiOutlineTrash } from 'react-icons/hi'
import ProductImage from '../common/ProductImage'
import {
  lineGross,
  lineSavingsDisplay,
  lineTotalWithTax,
  parseQty,
  formatQty,
  roundQty,
  QTY_DECIMALS,
} from '../../utils/billing'
import { usePendingChanges } from '../../hooks/usePendingChanges'

const INDEX_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-fuchsia-100 text-fuchsia-700',
  'bg-amber-100 text-amber-700',
]

export default function CartItem({
  item,
  onQtyChange,
  onQtySet,
  onRemove,
  maxQty,
  currency = '₹',
  taxRate = 0,
  index,
  discountEnabled = false,
  discountType = 'percent',
  maxDiscountPercent = 100,
  editableDiscount = false,
}) {
  const { name, price, qty, barcode, batch, discount = 0 } = item
  const { pendingChanges, patchPendingChanges } = usePendingChanges({
    qtyInput: formatQty(qty),
    isEditingQty: false,
  })
  const { qtyInput, isEditingQty } = pendingChanges
  const atMax = maxQty != null && roundQty(qty) >= roundQty(maxQty)

  useEffect(() => {
    if (!isEditingQty) patchPendingChanges({ qtyInput: formatQty(qty) })
  }, [qty, isEditingQty, patchPendingChanges])

  const clampInput = (raw) => {
    let cleaned = raw.replace(/[^\d.]/g, '')
    const dotIndex = cleaned.indexOf('.')
    if (dotIndex !== -1) {
      cleaned =
        cleaned.slice(0, dotIndex + 1) +
        cleaned.slice(dotIndex + 1).replace(/\./g, '').slice(0, QTY_DECIMALS)
    }
    if (!cleaned || maxQty == null) return cleaned
    const n = parseFloat(cleaned)
    if (!Number.isFinite(n)) return cleaned
    if (n > maxQty) return formatQty(maxQty)
    return cleaned
  }

  const commitQty = () => {
    const trimmed = qtyInput.trim()
    if (!trimmed || !Number.isFinite(parseFloat(trimmed))) {
      patchPendingChanges({ qtyInput: formatQty(qty), isEditingQty: false })
    } else {
      onQtySet?.(item, parseQty(trimmed, qty))
      patchPendingChanges({ isEditingQty: false })
    }
  }

  const gross = lineGross(item)
  const discountAmt = lineSavingsDisplay(item, discountType, maxDiscountPercent)
  const grandTotal = lineTotalWithTax(item, taxRate, discountType, maxDiscountPercent)
  const hasDiscount =
    discountEnabled &&
    (discountAmt > 0 || (discountType === 'percent' && Number(discount) > 0))

  const discountLabel = discountType === 'percent' ? '%' : currency

  return (
    <div className="py-3 px-3 border-b border-slate-300 hover:border-violet-200 hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-fuchsia-50/30 transition-all group">
      <div className="flex items-center gap-3">
        <span className={`hidden sm:flex w-6 h-6 rounded-lg text-xs font-bold items-center justify-center shrink-0 ${INDEX_COLORS[(index - 1) % INDEX_COLORS.length]}`}>
          {index}
        </span>
        <ProductImage product={item} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-slate-900 font-semibold truncate text-sm">
            {name}
            {batch ? <span className="text-teal-700 font-medium"> · {batch}</span> : null}
          </p>
          <p className="text-slate-400 text-xs mt-0.5">
            {currency}{Number(price).toFixed(2)} / unit
            <span className="mx-1.5 text-slate-300">·</span>
            <span className="font-mono">{barcode || '—'}</span>
            {maxQty != null && (
              <>
                <span className="mx-1.5 text-slate-300">·</span>
                <span className={atMax ? 'text-amber-600 font-semibold' : ''}>
                  Stock: {formatQty(maxQty)}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-blue-50 rounded-md p-1 shrink-0 border border-blue-200/60">
          <button
            type="button"
            onClick={() => {
              patchPendingChanges({ isEditingQty: false })
              onQtyChange(item, -1)
            }}
            aria-label="Decrease quantity"
            className="w-8 h-8 rounded-md bg-white text-blue-700 hover:bg-blue-50 flex items-center justify-center text-lg font-bold transition-colors cursor-pointer"
          >
            −
          </button>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
            value={qtyInput}
            onChange={(e) => {
              patchPendingChanges({ qtyInput: clampInput(e.target.value), isEditingQty: true })
            }}
            onFocus={(e) => {
              patchPendingChanges({ isEditingQty: true })
              e.target.select()
            }}
            onBlur={commitQty}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.currentTarget.blur()
              }
              if (e.key === 'Escape') {
                patchPendingChanges({ qtyInput: formatQty(qty), isEditingQty: false })
                e.currentTarget.blur()
              }
              e.stopPropagation()
            }}
            aria-label={`Quantity for ${name}`}
            className="w-14 h-8 text-center text-violet-900 font-bold text-sm bg-white rounded-md border-2 border-violet-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
          />
          <button
            type="button"
            disabled={atMax}
            onClick={() => {
              patchPendingChanges({ isEditingQty: false })
              onQtyChange(item, 1)
            }}
            aria-label="Increase quantity"
            className="w-8 h-8 rounded-md bg-white text-blue-700 hover:bg-blue-50 flex items-center justify-center text-lg font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
        <div className="text-right min-w-[88px] shrink-0">
          {hasDiscount ? (
            <>
              <p className="text-slate-400 text-xs line-through">{currency}{gross.toFixed(2)}</p>
              <p className="text-fuchsia-600 font-bold text-sm">{currency}{grandTotal.toFixed(2)}</p>
            </>
          ) : (
            <p className="text-fuchsia-600 font-bold text-sm">{currency}{grandTotal.toFixed(2)}</p>
          )}
          <button
            type="button"
            onClick={() => onRemove(item)}
            aria-label={`Remove ${name}`}
            className="mt-1 w-8 h-8 rounded-md inline-flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      </div>

      {discountEnabled && hasDiscount && (
        <div className="mt-2.5 ml-0 sm:ml-[4.25rem] flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-violet-700 shrink-0">Discount:</span>
          <span className="text-xs font-semibold text-violet-700">
            {Number(discount)}{discountLabel}
          </span>
          <span className="text-xs font-semibold text-emerald-600">
            {discountAmt > 0
              ? `−${currency}${discountAmt.toFixed(2)} vs MRP`
              : 'included in selling price'}
          </span>
          {!editableDiscount && (
            <span className="text-[11px] text-slate-400">
              (set in Settings)
            </span>
          )}
        </div>
      )}
    </div>
  )
}
