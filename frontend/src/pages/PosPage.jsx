import { useCallback, useEffect, useRef, useMemo } from 'react'
import BarcodeInput from '../components/billing/BarcodeInput'
import { useHardwareScanner } from '../hooks/useHardwareScanner'
import { useMobileScanner } from '../hooks/useMobileScanner'
import CartSummary from '../components/billing/CartSummary'
import PosSummaryPanel from '../components/billing/PosSummaryPanel'
import Card from '../components/common/Card'
import ProductImage from '../components/common/ProductImage'
import Button from '../components/common/Button'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import InvoiceCustomerModal from '../components/billing/InvoiceCustomerModal'
import BillReviewModal from '../components/billing/BillReviewModal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { generateInvoicePdfForPrint } from '../utils/generateInvoicePdf'
import { calcCartTotals, applyBillDiscount, lineSavingsDisplay, lineNet, lineTax, lineTotalWithTax, getProductStock, getCartLineStock, clampQtyToStock, remainingStock, parseQty, formatQty, roundQty } from '../utils/billing'
import { getAvailableBatches, getProductBatches, productForBatch, formatBatchSummary } from '../utils/productBatches'
import BatchPickModal from '../components/billing/BatchPickModal'
import { useAsyncAction, delay } from '../hooks/useAsyncAction'
import { usePendingChanges } from '../hooks/usePendingChanges'
import { validateBillDiscount } from '../utils/billingValidation'
import { playPosAddSound } from '../utils/posSounds'

function isTypingTarget(el) {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

function addProductToCart(prev, productLine, addAmount = 1) {
  const amount = parseQty(addAmount, 1)
  const batchId = productLine.productBatchId || ''
  const maxStock = getCartLineStock(productLine, batchId)
  if (maxStock <= 0) return { cart: prev, capped: true, maxStock, added: false }

  const existing = prev.find(
    (i) => i.barcode === productLine.barcode && (i.productBatchId || '') === batchId
  )
  if (existing) {
    const desired = existing.qty + amount
    const nextQty = clampQtyToStock(desired, productLine, batchId)
    if (nextQty === existing.qty) {
      return { cart: prev, capped: true, maxStock, added: false }
    }
    return {
      cart: prev.map((i) =>
        i.barcode === productLine.barcode && (i.productBatchId || '') === batchId
          ? { ...i, qty: nextQty }
          : i
      ),
      capped: nextQty < desired,
      maxStock,
      added: true,
    }
  }

  const initialQty = clampQtyToStock(amount, productLine, batchId)
  if (initialQty <= 0) return { cart: prev, capped: true, maxStock, added: false }

  return {
    cart: [
      ...prev,
      {
        ...productLine,
        qty: initialQty,
        cartId: Date.now(),
        discount: Number(productLine.discount) || 0,
      },
    ],
    capped: initialQty < amount,
    maxStock,
    added: true,
  }
}

function filterProducts(products, query) {
  const trimmed = query.trim()
  const q = trimmed.toLowerCase()
  if (!q) return []

  return products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(trimmed) ||
        (p.category && p.category.toLowerCase().includes(q))
    )
    .slice(0, 12)
}

const INITIAL = {
  cart: [],
  notFoundBarcode: null,
  searchQuery: '',
  highlightedIndex: -1,
  showBillDialog: false,
  showBillReview: false,
  showClearConfirm: false,
  batchPickProduct: null,
  billDiscount: '',
  billDiscountType: 'amount',
}

export default function PosPage() {
  const { products, getProductByBarcode, addOrder, settings } = useStore()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { loading: billLoading, run: runBill } = useAsyncAction()
  const { pendingChanges, setPendingChanges, patchPendingChanges } = usePendingChanges(INITIAL)
  const {
    cart,
    notFoundBarcode,
    searchQuery,
    highlightedIndex,
    showBillDialog,
    showBillReview,
    showClearConfirm,
    batchPickProduct,
    billDiscount,
    billDiscountType,
  } = pendingChanges
  const barcodeInputRef = useRef(null)
  const suggestionRefs = useRef([])
  const {
    taxRate = 5,
    currency = '₹',
    discountEnabled = true,
    discountType = 'percent',
    maxDiscountPercent = 50,
    billDiscountEnabled = false,
  } = settings
  const posModalOpen = showBillDialog || showBillReview || showClearConfirm || !!batchPickProduct
  const scannerActive = !posModalOpen

  const cartTotals = useMemo(() => {
    const base = calcCartTotals(cart, { taxRate, discountType, maxDiscountPercent })
    if (!billDiscountEnabled) return { ...base, billDiscountAmount: 0, totalBeforeBillDiscount: base.total }
    return applyBillDiscount(base, { billDiscount, billDiscountType })
  }, [cart, taxRate, discountType, maxDiscountPercent, billDiscount, billDiscountType, billDiscountEnabled])

  useEffect(() => {
    if (!billDiscountEnabled) {
      patchPendingChanges({ billDiscount: '', billDiscountType: 'amount' })
    }
  }, [billDiscountEnabled, patchPendingChanges])

  const {
    grossSubtotal,
    discountTotal,
    discountApplied,
    subtotal,
    tax,
    total,
    billDiscountAmount,
    totalBeforeBillDiscount,
  } = cartTotals
  const totalQty = cart.reduce((sum, i) => sum + i.qty, 0)

  const billDiscountError = useMemo(() => {
    if (!billDiscountEnabled || !billDiscount.trim()) return ''
    return validateBillDiscount(billDiscount, billDiscountType, { maxAmount: total }) || ''
  }, [billDiscountEnabled, billDiscount, billDiscountType, total])

  const suggestions = useMemo(
    () => filterProducts(products, searchQuery),
    [products, searchQuery]
  )

  const showSuggestions = searchQuery.trim().length > 0 && suggestions.length > 0

  const isProductSelectable = useCallback(
    (product) => {
      const batches = getAvailableBatches(product)
      if (batches.length > 0) {
        return batches.some((batch) => {
          const inBill =
            cart.find(
              (i) =>
                i.barcode === product.barcode && (i.productBatchId || '') === batch.id
            )?.qty || 0
          return remainingStock(product, inBill, batch.id) > 0
        })
      }
      const inBill = cart.find((i) => i.barcode === product.barcode)?.qty || 0
      return remainingStock(product, inBill) > 0
    },
    [cart]
  )

  const selectableSuggestionIndices = useMemo(
    () => suggestions.map((p, i) => (isProductSelectable(p) ? i : -1)).filter((i) => i >= 0),
    [suggestions, isProductSelectable]
  )

  useEffect(() => {
    if (!showSuggestions) {
      patchPendingChanges({ highlightedIndex: -1 })
      return
    }
    setPendingChanges((prev) => {
      const prevIndex = prev.highlightedIndex
      if (prevIndex >= 0 && prevIndex < suggestions.length && isProductSelectable(suggestions[prevIndex])) {
        return prev
      }
      return { ...prev, highlightedIndex: selectableSuggestionIndices[0] ?? 0 }
    })
  }, [searchQuery, suggestions, showSuggestions, selectableSuggestionIndices, isProductSelectable, patchPendingChanges, setPendingChanges])

  useEffect(() => {
    if (!showSuggestions || highlightedIndex < 0) return
    suggestionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex, showSuggestions])

  const cartQtyFor = useCallback(
    (barcode, productBatchId = '') => {
      return cart
        .filter(
          (i) => i.barcode === barcode && (i.productBatchId || '') === (productBatchId || '')
        )
        .reduce((sum, i) => sum + i.qty, 0)
    },
    [cart]
  )

  const clearSearch = useCallback(() => {
    patchPendingChanges({ searchQuery: '' })
    barcodeInputRef.current?.clear()
  }, [patchPendingChanges])

  const addToCart = useCallback(
    (product, batch = null) => {
      const allBatches = getProductBatches(product).filter((b) => b.name)
      const available = getAvailableBatches(product)
      if (!batch && allBatches.length > 1) {
        patchPendingChanges({ batchPickProduct: product })
        return
      }

      const chosen = batch || available[0] || allBatches[0]
      if (!chosen || chosen.stock <= 0) {
        showToast(`${product.name} is out of stock`, 'error')
        return
      }

      const line = productForBatch(product, chosen)
      setPendingChanges((prev) => {
        const { cart: nextCart, capped, maxStock, added } = addProductToCart(prev.cart, line, 1)
        if (added) playPosAddSound()
        if (capped) {
          showToast(`Only ${formatQty(maxStock)} in stock for ${line.name} (${line.batch})`, 'info')
        }
        return { ...prev, cart: nextCart }
      })
    },
    [showToast, patchPendingChanges, setPendingChanges]
  )

  const handleBatchPick = useCallback(
    (batch) => {
      if (!batchPickProduct) return
      addToCart(batchPickProduct, batch)
      patchPendingChanges({ batchPickProduct: null })
      clearSearch()
    },
    [batchPickProduct, addToCart, clearSearch, patchPendingChanges]
  )

  useEffect(() => {
    if (batchPickProduct) {
      document.activeElement?.blur?.()
    }
  }, [batchPickProduct])

  const batchPickBatches = useMemo(
    () => (batchPickProduct ? getProductBatches(batchPickProduct).filter((b) => b.name) : []),
    [batchPickProduct]
  )

  const getMaxQtyForItem = useCallback(
    (item) => {
      const product = getProductByBarcode(item.barcode)
      return product ? getCartLineStock(product, item.productBatchId) : null
    },
    [getProductByBarcode]
  )

  const handleQueryChange = useCallback((value) => {
    patchPendingChanges({
      searchQuery: value,
      ...(value.trim() ? { notFoundBarcode: null } : {}),
    })
  }, [patchPendingChanges])

  const handleScan = useCallback(
    (value) => {
      const trimmed = String(value).trim()
      if (!trimmed) return

      patchPendingChanges({ notFoundBarcode: null })

      const byBarcode = getProductByBarcode(trimmed)
      if (byBarcode) {
        addToCart(byBarcode)
        clearSearch()
        return
      }

      const matches = filterProducts(products, trimmed)
      if (matches.length === 0) {
        patchPendingChanges({ notFoundBarcode: trimmed })
        showToast('Product not found — add it from Products page or try another scan', 'error')
        clearSearch()
      } else if (matches.length === 1) {
        addToCart(matches[0])
        clearSearch()
      }
      // Multiple matches: keep query so suggestions stay visible for click
    },
    [getProductByBarcode, products, addToCart, showToast, clearSearch, patchPendingChanges]
  )

  useHardwareScanner(handleScan, { active: scannerActive })

  const { status: mobileScannerStatus } = useMobileScanner(handleScan, {
    active: scannerActive,
  })

  const handleSelectFromSearch = useCallback(
    (product) => {
      addToCart(product)
      patchPendingChanges({ notFoundBarcode: null })
      clearSearch()
    },
    [addToCart, clearSearch, patchPendingChanges]
  )

  const handleNavigateSuggestions = useCallback(
    (direction) => {
      if (!showSuggestions || selectableSuggestionIndices.length === 0) return false

      const currentPos = selectableSuggestionIndices.indexOf(highlightedIndex)
      let nextPos
      if (currentPos === -1) {
        nextPos = direction === 'down' ? 0 : selectableSuggestionIndices.length - 1
      } else if (direction === 'down') {
        nextPos = (currentPos + 1) % selectableSuggestionIndices.length
      } else {
        nextPos = (currentPos - 1 + selectableSuggestionIndices.length) % selectableSuggestionIndices.length
      }

      patchPendingChanges({ highlightedIndex: selectableSuggestionIndices[nextPos] })
      return true
    },
    [showSuggestions, selectableSuggestionIndices, highlightedIndex, patchPendingChanges]
  )

  const handleSelectHighlightedSuggestion = useCallback(() => {
    if (!showSuggestions || highlightedIndex < 0) return false
    const product = suggestions[highlightedIndex]
    if (!product || !isProductSelectable(product)) return false
    handleSelectFromSearch(product)
    return true
  }, [showSuggestions, highlightedIndex, suggestions, isProductSelectable, handleSelectFromSearch])

  useEffect(() => {
    if (!showSuggestions) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') clearSearch()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showSuggestions, clearSearch])

  const updateCartQty = useCallback(
    (item, nextQty, product) => {
      const parsed = roundQty(Math.max(0, Number(nextQty) || 0))
      const batchId = item.productBatchId || ''
      const maxStock = product ? getCartLineStock(product, batchId) : parsed
      const clamped = product ? clampQtyToStock(parsed, product, batchId) : parsed

      if (product && parsed > maxStock && parsed > 0) {
        showToast(`Only ${formatQty(maxStock)} in stock for ${item.name}`, 'info')
      }

      setPendingChanges((prev) => ({
        ...prev,
        cart: prev.cart
          .map((i) =>
            i.cartId === item.cartId ? { ...i, qty: clamped } : i
          )
          .filter((i) => i.qty > 0),
      }))
    },
    [showToast, setPendingChanges]
  )

  const handleQtyChange = useCallback(
    (item, delta) => {
      const product = getProductByBarcode(item.barcode)
      const batchId = item.productBatchId || ''
      const nextQty = item.qty + delta
      if (delta > 0 && product && nextQty > getCartLineStock(product, batchId)) {
        showToast(`Only ${formatQty(getCartLineStock(product, batchId))} in stock for ${item.name}`, 'info')
      }
      updateCartQty(item, nextQty, product)
    },
    [getProductByBarcode, updateCartQty, showToast]
  )

  const handleQtySet = useCallback(
    (item, qty) => {
      const product = getProductByBarcode(item.barcode)
      updateCartQty(item, qty, product)
    },
    [getProductByBarcode, updateCartQty]
  )

  const handleRemove = useCallback((item) => {
    setPendingChanges((prev) => ({
      ...prev,
      cart: prev.cart.filter((i) => i.cartId !== item.cartId || i.barcode !== item.barcode),
    }))
    showToast(`Removed ${item.name}`, 'info')
  }, [showToast, setPendingChanges])

  const handleClearCart = useCallback(() => {
    patchPendingChanges({ cart: [], billDiscount: '', billDiscountType: 'amount' })
    barcodeInputRef.current?.focus()
    showToast('Bill cleared', 'info')
  }, [showToast, patchPendingChanges])

  const handleGenerateBillClick = useCallback(() => {
    if (cart.length === 0) return
    if (billDiscountError) {
      showToast(billDiscountError, 'error')
      return
    }
    patchPendingChanges({ showBillReview: true })
  }, [cart.length, billDiscountError, showToast, patchPendingChanges])

  const handlePrintBillConfirm = useCallback(
    ({ customerName, customerMobile }) => {
      runBill(async () => {
        await delay(400)
        const orderPayload = {
          items: cart.map((item) => ({
            name: item.name,
            barcode: item.barcode,
            mrp: item.mrp,
            hsn: item.hsn || '',
            gst: item.gst,
            batch: item.batch || '',
            productBatchId: item.productBatchId || '',
            price: item.price,
            qty: item.qty,
            discount: item.discount || 0,
            lineDiscount: lineSavingsDisplay(item, discountType, maxDiscountPercent),
            lineTotal: lineNet(item, discountType, maxDiscountPercent),
            lineTax: lineTax(item, taxRate, discountType, maxDiscountPercent),
            lineGrandTotal: lineTotalWithTax(item, taxRate, discountType, maxDiscountPercent),
          })),
          grossSubtotal,
          discountTotal,
          discountApplied,
          subtotal,
          tax,
          totalBeforeBillDiscount,
          billDiscount: billDiscountEnabled && billDiscountAmount > 0 ? Number(billDiscount) || 0 : 0,
          billDiscountType: billDiscountEnabled ? billDiscountType : 'amount',
          billDiscountAmount: billDiscountEnabled ? billDiscountAmount : 0,
          total,
          customerName: (customerName || '').trim(),
          customerMobile: (customerMobile || '').trim(),
          createdBy: user
            ? { id: user.id, username: user.username, name: user.name, role: user.role }
            : undefined,
        }
        const orderId = await addOrder(orderPayload)
        const savedOrder = {
          id: orderId,
          date: new Date().toISOString(),
          ...orderPayload,
        }
        patchPendingChanges({
          showBillDialog: false,
          cart: [],
          billDiscount: '',
          billDiscountType: 'amount',
        })
        await generateInvoicePdfForPrint(settings, savedOrder)
        barcodeInputRef.current?.focus()
        showToast('Bill saved — print dialog opened')
      })
    },
    [cart, grossSubtotal, discountTotal, subtotal, tax, total, totalBeforeBillDiscount, billDiscount, billDiscountType, billDiscountAmount, billDiscountEnabled, discountType, maxDiscountPercent, taxRate, addOrder, settings, showToast, runBill, user, patchPendingChanges]
  )

  useEffect(() => {
    const onKeyDown = (e) => {
      if (isTypingTarget(document.activeElement)) return

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        barcodeInputRef.current?.focus()
        return
      }
      if (e.key === 'F2') {
        e.preventDefault()
        if (cart.length > 0) patchPendingChanges({ showBillDialog: true })
        return
      }
      if (e.key === 'Delete') {
        e.preventDefault()
        if (cart.length > 0) handleClearCart()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [cart.length, handleClearCart, patchPendingChanges])

  return (
    <div className="h-full flex flex-col gap-5 sm:gap-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2 flex flex-col gap-4 sm:gap-5">
          <Card
            className={`p-5 sm:p-6 border-2 border-violet-200 shadow-lg shadow-violet-100/60 !overflow-visible transition-opacity ${
              posModalOpen ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                  mobileScannerStatus.connected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
                title={mobileScannerStatus.url || 'Mobile scanner'}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    mobileScannerStatus.connected ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
                {mobileScannerStatus.connected ? 'Mobile scanner ready' : 'Mobile scanner waiting'}
              </span>
              {mobileScannerStatus.connected && mobileScannerStatus.scannerCount > 0 ? (
                <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
                  {mobileScannerStatus.scannerCount} phone{mobileScannerStatus.scannerCount !== 1 ? 's' : ''} connected
                </span>
              ) : null}
            </div>
            <div className="relative z-30">
                <BarcodeInput
                  ref={barcodeInputRef}
                  active={scannerActive}
                  onScan={handleScan}
                  onQueryChange={handleQueryChange}
                  onNavigateSuggestions={handleNavigateSuggestions}
                  onSelectSuggestion={handleSelectHighlightedSuggestion}
                  placeholder="Scan barcode or type product name... (Ctrl/Cmd+K to focus)"
                  inputProps={{
                    role: 'combobox',
                    'aria-autocomplete': 'list',
                    'aria-expanded': showSuggestions,
                    'aria-controls': showSuggestions ? 'pos-suggestions-list' : undefined,
                    'aria-activedescendant':
                      showSuggestions && highlightedIndex >= 0
                        ? `pos-suggestion-${highlightedIndex}`
                        : undefined,
                  }}
                />

                {showSuggestions && (
                  <div
                    data-pos-suggestions
                    className="absolute left-0 right-0 top-[calc(100%-0.25rem)] z-50 rounded-md border-2 border-violet-400 bg-white shadow-2xl shadow-violet-300/40 ring-4 ring-violet-100/80 max-h-72 overflow-auto"
                  >
                    <ul id="pos-suggestions-list" role="listbox" className="divide-y divide-violet-100">
                      {suggestions.map((p, idx) => {
                        const inBill = cartQtyFor(p.barcode)
                        const available = remainingStock(p, inBill)
                        const batchLabel = formatBatchSummary(p)
                        const outOfStock = available <= 0
                        const isHighlighted = idx === highlightedIndex
                        return (
                          <li key={p.id} role="presentation">
                            <button
                              ref={(el) => {
                                suggestionRefs.current[idx] = el
                              }}
                              id={`pos-suggestion-${idx}`}
                              type="button"
                              role="option"
                              aria-selected={isHighlighted}
                              disabled={outOfStock}
                              onMouseDown={(e) => e.preventDefault()}
                              onMouseEnter={() => !outOfStock && patchPendingChanges({ highlightedIndex: idx })}
                              onClick={() => !outOfStock && handleSelectFromSearch(p)}
                              className={`w-full px-4 py-3.5 text-left flex items-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                isHighlighted
                                  ? 'bg-blue-200 ring-2 ring-inset ring-blue-500'
                                  : idx % 2 === 0
                                    ? 'bg-white'
                                    : 'bg-blue-50/60'
                              } hover:bg-blue-100 focus-visible:bg-blue-100 focus-visible:outline-none`}
                            >
                              <ProductImage product={p} size="sm" />
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-900 font-bold truncate text-sm">{p.name}</p>
                                <p className="text-slate-500 text-xs mt-0.5 font-mono truncate">
                                  {p.barcode}
                                  {batchLabel && batchLabel !== '—' && (
                                    <span className="ml-2 text-teal-700 font-sans font-semibold">· {batchLabel}</span>
                                  )}
                                </p>
                              </div>
                              <div className="text-right shrink-0 pl-2">
                                <p className="text-fuchsia-700 text-base font-extrabold">
                                  {currency}{Number(p.price).toFixed(2)}
                                </p>
                                <p className={`text-xs font-bold mt-0.5 ${outOfStock ? 'text-red-600' : 'text-emerald-700'}`}>
                                  {outOfStock ? 'Out of stock' : `Stock: ${available}`}
                                </p>
                                {inBill > 0 && (
                                  <p className="text-xs text-violet-700 font-bold mt-0.5 bg-violet-100 px-1.5 py-0.5 rounded">
                                    In bill: {inBill}
                                  </p>
                                )}
                              </div>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                {searchQuery.trim() && suggestions.length === 0 && !notFoundBarcode && (
                  <div className="absolute left-0 right-0 top-[calc(100%-0.25rem)] z-50 rounded-md border-2 border-amber-300 bg-amber-50 px-4 py-3 shadow-lg text-sm text-amber-900 font-medium">
                    No products match &quot;{searchQuery.trim()}&quot;
                  </div>
                )}
              </div>

            {notFoundBarcode && (
              <div className="mt-4 p-4 rounded-md bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center gap-3">
                <p className="text-amber-900 text-sm flex-1">
                  <span className="font-semibold">Not in inventory:</span>{' '}
                  <span className="font-mono">{notFoundBarcode}</span>
                  <span className="block text-amber-700/80 text-xs mt-1">Add this product from the Products page first.</span>
                </p>
                <Button variant="outline" className="!py-2 !px-3 text-sm shrink-0" onClick={() => patchPendingChanges({ notFoundBarcode: null })}>
                  Dismiss
                </Button>
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6 flex-1 flex flex-col min-h-[320px]">
            <h2 className="text-base font-bold bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 animate-pulse" />
              Current bill
            </h2>
            <p className="text-slate-400 text-xs mb-4">
              Use +/− or type quantity (e.g. 1.2 for kg; cannot exceed stock){discountEnabled ? ' · discount applies from product settings' : ''}
            </p>
            <CartSummary
              items={cart}
              onQtyChange={handleQtyChange}
              onQtySet={handleQtySet}
              onRemove={handleRemove}
              getMaxQty={getMaxQtyForItem}
              currency={currency}
              taxRate={taxRate}
              discountEnabled={discountEnabled}
              discountType={discountType}
              maxDiscountPercent={maxDiscountPercent}
              editableDiscount={false}
            />
          </Card>
        </div>

        <div className="xl:col-span-1">
          <PosSummaryPanel
            itemCount={cart.length}
            totalQty={totalQty}
            grossSubtotal={grossSubtotal}
            discountTotal={discountTotal}
            discountApplied={discountApplied}
            subtotal={subtotal}
            total={total}
            totalBeforeBillDiscount={totalBeforeBillDiscount}
            billDiscount={billDiscount}
            billDiscountType={billDiscountType}
            billDiscountAmount={billDiscountAmount}
            onBillDiscountChange={(value) => patchPendingChanges({ billDiscount: value })}
            onBillDiscountTypeChange={(value) => patchPendingChanges({ billDiscountType: value })}
            currency={currency}
            discountEnabled={discountEnabled}
            billDiscountEnabled={billDiscountEnabled}
            billDiscountError={billDiscountError}
            onGenerateBill={handleGenerateBillClick}
            onRequestClearCart={() => patchPendingChanges({ showClearConfirm: true })}
            billLoading={billLoading}
          />
        </div>
      </div>

      <BillReviewModal
        open={showBillReview}
        items={cart}
        currency={currency}
        taxRate={taxRate}
        discountType={discountType}
        maxDiscountPercent={maxDiscountPercent}
        discountEnabled={discountEnabled}
        billDiscountEnabled={billDiscountEnabled}
        grossSubtotal={grossSubtotal}
        discountTotal={discountTotal}
        discountApplied={discountApplied}
        subtotal={subtotal}
        tax={tax}
        total={total}
        totalBeforeBillDiscount={totalBeforeBillDiscount}
        billDiscountAmount={billDiscountAmount}
        onContinue={() => {
          patchPendingChanges({ showBillReview: false, showBillDialog: true })
        }}
        onCancel={() => patchPendingChanges({ showBillReview: false })}
      />

      <InvoiceCustomerModal
        open={showBillDialog}
        totalFormatted={total ? `${currency}${total.toFixed(2)}` : ''}
        confirmLoading={billLoading}
        onConfirm={handlePrintBillConfirm}
        onCancel={() => {
          patchPendingChanges({ showBillDialog: false, showBillReview: true })
        }}
      />

      <ConfirmDialog
        open={showClearConfirm}
        title="Clear bill?"
        message={`Remove all ${cart.length} item${cart.length === 1 ? '' : 's'} from this bill? This cannot be undone.`}
        confirmLabel="Clear bill"
        cancelLabel="Keep bill"
        variant="danger"
        onConfirm={() => {
          handleClearCart()
          patchPendingChanges({ showClearConfirm: false })
        }}
        onCancel={() => patchPendingChanges({ showClearConfirm: false })}
      />

      {batchPickProduct ? (
        <BatchPickModal
          product={batchPickProduct}
          batches={batchPickBatches}
          currency={currency}
          onPick={handleBatchPick}
          onClose={() => patchPendingChanges({ batchPickProduct: null })}
        />
      ) : null}
    </div>
  )
}
