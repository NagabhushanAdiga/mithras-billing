import CartItem from './CartItem'
import { formatQty } from '../../utils/billing'

export default function CartSummary({
  items,
  onQtyChange,
  onQtySet,
  onRemove,
  getMaxQty,
  currency = '₹',
  taxRate = 0,
  discountEnabled = false,
  discountType = 'percent',
  maxDiscountPercent = 100,
  editableDiscount = false,
}) {
  const totalQty = items.reduce((sum, i) => sum + i.qty, 0)
  const totalQtyLabel = formatQty(totalQty)

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
        <p className="text-sm text-slate-500">
          {items.length === 0 ? (
            'No items yet'
          ) : (
            <>
              <span className="font-bold text-slate-800">{items.length}</span> product{items.length !== 1 ? 's' : ''}
              {' · '}
              <span className="font-bold text-slate-800">{totalQtyLabel}</span> unit{totalQty !== 1 ? 's' : ''}
            </>
          )}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-auto -mx-1 px-1 max-h-[50vh] lg:max-h-none">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-16 h-16 rounded-md bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
              <span className="text-3xl">🛒</span>
            </div>
            <p className="text-slate-700 text-base font-bold">Start scanning</p>
            <p className="text-slate-400 text-sm mt-2 max-w-xs leading-relaxed">
              Scan a barcode or search by product name in the field above.
              {discountEnabled && ' Discounts apply from product settings.'}
            </p>
          </div>
        ) : (
          <div>
            {items.map((item, idx) => (
              <CartItem
                key={(item.cartId || item.id) + item.barcode}
                index={idx + 1}
                item={item}
                onQtyChange={onQtyChange}
                onQtySet={onQtySet}
                onRemove={onRemove}
                maxQty={getMaxQty?.(item)}
                currency={currency}
                taxRate={taxRate}
                discountEnabled={discountEnabled}
                discountType={discountType}
                maxDiscountPercent={maxDiscountPercent}
                editableDiscount={editableDiscount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
