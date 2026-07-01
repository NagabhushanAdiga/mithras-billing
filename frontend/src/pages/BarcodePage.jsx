import { useEffect, useMemo, useRef } from 'react'
import JsBarcode from 'jsbarcode'
import { HiOutlineDownload, HiOutlinePrinter, HiOutlineSparkles, HiOutlineTrash, HiOutlineClock } from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import PageHeader from '../components/common/PageHeader'
import Pagination from '../components/common/Pagination'
import { useStore } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'
import { useAsyncAction, delay } from '../hooks/useAsyncAction'
import { usePagination } from '../hooks/usePagination'
import { usePendingChanges } from '../hooks/usePendingChanges'
import { sanitizeBarcode, generateUniqueBarcode, isBarcodeTaken } from '../utils/barcode'
import {
  loadBarcodeLabels,
  saveBarcodeLabel,
  removeBarcodeLabel,
} from '../utils/barcodeLabelHistory'

function formatPrice(currency, price) {
  const num = Number(price)
  if (price === '' || isNaN(num)) return ''
  return `${currency}${num.toFixed(2)}`
}

function formatQuantityLabel(text) {
  return String(text || '').trim()
}

function renderBarcodeOnSvg(svgEl, barcodeValue, compact = false) {
  JsBarcode(svgEl, barcodeValue, {
    format: 'CODE128',
    lineColor: compact ? '#111827' : '#1e1b4b',
    width: compact ? 1.6 : 2,
    height: compact ? 52 : 70,
    displayValue: true,
    margin: compact ? 2 : 8,
    fontSize: compact ? 10 : 14,
  })
}

function downloadBarcodeImage(svgEl, { barcodeValue, labelText, priceText, qtyText }) {
  const svgData = new XMLSerializer().serializeToString(svgEl)
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  const img = new Image()

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const padding = 24
      const labelHeight = labelText ? 28 : 0
      const priceHeight = priceText ? 22 : 0
      const qtyHeight = qtyText ? 20 : 0
      const metaHeight = labelHeight + priceHeight + qtyHeight
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(img.width + padding * 2, 280)
      canvas.height = img.height + padding * 2 + metaHeight
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      let y = padding
      if (labelText) {
        ctx.fillStyle = '#334155'
        ctx.font = 'bold 14px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(labelText, canvas.width / 2, y + 16)
        y += labelHeight
      }
      if (priceText) {
        ctx.fillStyle = '#7c3aed'
        ctx.font = 'bold 13px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(priceText, canvas.width / 2, y + 14)
        y += priceHeight
      }
      if (qtyText) {
        ctx.fillStyle = '#0d9488'
        ctx.font = 'bold 12px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(qtyText, canvas.width / 2, y + 12)
        y += qtyHeight
      }
      const x = (canvas.width - img.width) / 2
      ctx.drawImage(img, x, y)
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url)
        if (!blob) {
          reject(new Error('Failed to create image'))
          return
        }
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `barcode-${barcodeValue}.png`
        a.click()
        URL.revokeObjectURL(a.href)
        resolve()
      }, 'image/png')
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to render barcode'))
    }
    img.src = url
  })
}

function downloadBarcodeSvg(svgEl, barcodeValue) {
  const svgData = new XMLSerializer().serializeToString(svgEl)
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `barcode-${barcodeValue}.svg`
  a.click()
  URL.revokeObjectURL(a.href)
}

function LabelMeta({ label, priceText, qtyText }) {
  return (
    <>
      {label && <p className="text-xs font-semibold text-slate-700 text-center">{label}</p>}
      {qtyText && <p className="text-xs font-bold text-teal-700 text-center mt-0.5">{qtyText}</p>}
      {priceText && <p className="text-xs font-bold text-violet-600 text-center mt-0.5">{priceText}</p>}
    </>
  )
}

function formatHistoryDate(iso) {
  const d = new Date(iso)
  return d.toLocaleString([], {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function BarcodeHistoryCard({ item, currency, onSelect, onDelete }) {
  const svgRef = useRef(null)
  const priceText = item.showPriceOnLabel ? formatPrice(currency, item.price) : ''
  const qtyText = item.showQuantityOnLabel ? formatQuantityLabel(item.quantityLabel) : ''

  useEffect(() => {
    if (!svgRef.current || !item.barcode) return
    try {
      renderBarcodeOnSvg(svgRef.current, item.barcode, true)
    } catch {
      // skip invalid stored value
    }
  }, [item.barcode])

  return (
    <div className="group relative rounded-md border border-slate-200 bg-white p-3 hover:border-violet-300 hover:shadow-md transition-all">
      <button
        type="button"
        onClick={() => onSelect(item)}
        className="w-full text-left cursor-pointer"
      >
        <LabelMeta label={item.label} priceText={priceText} qtyText={qtyText} />
        <svg ref={svgRef} className="w-full mt-1" />
        <p className="text-[10px] font-mono text-slate-600 text-center mt-1 truncate">{item.barcode}</p>
        <p className="text-[10px] text-slate-400 text-center mt-0.5 flex items-center justify-center gap-1">
          <HiOutlineClock className="w-3 h-3 shrink-0" />
          {formatHistoryDate(item.createdAt)}
        </p>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(item.id)
        }}
        className="absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        aria-label="Remove from history"
      >
        <HiOutlineTrash className="w-4 h-4" />
      </button>
    </div>
  )
}

const INITIAL_PENDING_CHANGES = {
  mode: 'product',
  productId: '',
  barcode: '',
  label: '',
  price: '',
  showPriceOnLabel: false,
  quantityLabel: '',
  showQuantityOnLabel: false,
  copies: '1',
  history: loadBarcodeLabels(),
}

export default function BarcodePage() {
  const { products, settings } = useStore()
  const { showToast } = useToast()
  const { loading: printing, run: runPrint } = useAsyncAction()
  const { loading: downloadingPng, run: runDownloadPng } = useAsyncAction()
  const { loading: downloadingSvg, run: runDownloadSvg } = useAsyncAction()
  const currency = settings?.currency || '₹'

  const { pendingChanges, setPendingChanges, patchPendingChanges } = usePendingChanges(INITIAL_PENDING_CHANGES)
  const svgRef = useRef(null)

  const {
    mode,
    productId,
    barcode,
    label,
    price,
    showPriceOnLabel,
    quantityLabel,
    showQuantityOnLabel,
    copies,
    history,
  } = pendingChanges

  const historyPagination = usePagination(history)

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  )

  useEffect(() => {
    if (mode !== 'product' || !selectedProduct) return
    patchPendingChanges({
      barcode: selectedProduct.barcode || '',
      label: selectedProduct.name || '',
      price: selectedProduct.price != null ? String(selectedProduct.price) : '',
    })
  }, [mode, selectedProduct])

  useEffect(() => {
    if (mode !== 'manual') return
    const trimmed = label.trim()
    if (!trimmed) {
      patchPendingChanges({ barcode: '' })
      return
    }
    setPendingChanges((prev) => {
      const current = sanitizeBarcode(prev.barcode)
      if (current && !isBarcodeTaken(products, current)) return prev
      return { ...prev, barcode: generateUniqueBarcode(products) }
    })
  }, [mode, label, products])

  const barcodeValue = sanitizeBarcode(barcode)
  const barcodeLabel = label.trim()
  const priceText = showPriceOnLabel ? formatPrice(currency, price) : ''
  const qtyText = showQuantityOnLabel ? formatQuantityLabel(quantityLabel) : ''

  const recordToHistory = () => {
    if (!barcodeValue) return
    const next = saveBarcodeLabel({
      barcode: barcodeValue,
      label: barcodeLabel,
      price,
      quantityLabel,
      showPriceOnLabel,
      showQuantityOnLabel,
      mode,
      productId: mode === 'product' ? productId : '',
    })
    setPendingChanges((prev) => ({ ...prev, history: next }))
  }

  const loadFromHistory = (item) => {
    const next = {
      mode: item.mode === 'product' && item.productId ? 'product' : 'manual',
      quantityLabel: item.quantityLabel || '',
      showPriceOnLabel: Boolean(item.showPriceOnLabel),
      showQuantityOnLabel: Boolean(item.showQuantityOnLabel),
    }
    if (item.mode === 'product' && item.productId && products.some((p) => p.id === item.productId)) {
      patchPendingChanges({ ...next, productId: item.productId })
    } else {
      patchPendingChanges({
        ...next,
        productId: '',
        barcode: item.barcode,
        label: item.label,
        price: item.price || '',
      })
    }
    showToast('Loaded from history — ready to print again')
  }

  const handleDeleteHistory = (id) => {
    setPendingChanges((prev) => ({ ...prev, history: removeBarcodeLabel(id) }))
    showToast('Removed from history', 'info')
  }

  useEffect(() => {
    if (!svgRef.current || !barcodeValue) return
    try {
      renderBarcodeOnSvg(svgRef.current, barcodeValue)
    } catch {
      // validation handled on submit
    }
  }, [barcodeValue])

  const switchToManual = () => {
    patchPendingChanges({
      mode: 'manual',
      productId: '',
      barcode: '',
      label: '',
      price: '',
      quantityLabel: '',
    })
  }

  const switchToProduct = () => {
    patchPendingChanges({
      mode: 'product',
      barcode: '',
      label: '',
      price: '',
      quantityLabel: '',
      productId: products[0]?.id || '',
    })
  }

  const validateBeforeExport = () => {
    if (mode === 'manual') {
      if (!label.trim()) {
        showToast('Enter a product name for manual labels', 'error')
        return false
      }
      if (!barcodeValue) {
        showToast('Barcode is not ready — enter a product name', 'error')
        return false
      }
      if (isBarcodeTaken(products, barcodeValue)) {
        showToast('Generated barcode conflicts with inventory — change the name to regenerate', 'error')
        return false
      }
      return true
    }
    if (!selectedProduct || !barcodeValue) {
      showToast('Select a product from inventory', 'error')
      return false
    }
    return true
  }

  const handlePrint = () => {
    if (!validateBeforeExport()) return
    runPrint(async () => {
      await delay(300)
      const copyCount = Math.max(1, Number(copies) || 1)

      const printWindow = window.open('', '_blank', 'width=900,height=700')
      if (!printWindow) {
        showToast('Popup blocked. Please allow popups to print.', 'error')
        return
      }

      const labelsHtml = Array.from({ length: copyCount })
        .map(
          () => `
        <div class="label">
          ${barcodeLabel ? `<div class="name">${barcodeLabel}</div>` : ''}
          ${qtyText ? `<div class="qty">${qtyText}</div>` : ''}
          ${priceText ? `<div class="price">${priceText}</div>` : ''}
          <svg class="barcode"></svg>
        </div>
      `
        )
        .join('')

      printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode</title>
          <style>
            body { font-family: Inter, sans-serif; padding: 18px; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
            .label { border: 1px dashed #c4b5fd; border-radius: 10px; padding: 8px; text-align: center; }
            .name { font-size: 12px; color: #334155; margin-bottom: 4px; font-weight: 600; }
            .qty { font-size: 11px; color: #0d9488; margin-bottom: 4px; font-weight: 700; }
            .price { font-size: 11px; color: #7c3aed; margin-bottom: 6px; font-weight: 700; }
            .barcode { width: 100%; height: 84px; }
          </style>
        </head>
        <body>
          <div class="grid">${labelsHtml}</div>
        </body>
      </html>
    `)
      printWindow.document.close()

      printWindow.document.querySelectorAll('svg.barcode').forEach((svg) => {
        try {
          renderBarcodeOnSvg(svg, barcodeValue, true)
        } catch {
          // ignore malformed label generation
        }
      })

      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }, 250)
      recordToHistory()
    })
  }

  const handleDownloadPng = () => {
    if (!validateBeforeExport()) return
    if (!svgRef.current) {
      showToast('Barcode preview not ready', 'error')
      return
    }
    runDownloadPng(async () => {
      await delay(250)
      try {
        await downloadBarcodeImage(svgRef.current, {
          barcodeValue,
          labelText: barcodeLabel,
          priceText,
          qtyText,
        })
        showToast('Barcode downloaded as PNG')
        recordToHistory()
      } catch {
        showToast('Could not download barcode', 'error')
      }
    })
  }

  const handleDownloadSvg = () => {
    if (!validateBeforeExport()) return
    if (!svgRef.current) {
      showToast('Barcode preview not ready', 'error')
      return
    }
    runDownloadSvg(async () => {
      await delay(200)
      downloadBarcodeSvg(svgRef.current, barcodeValue)
      showToast('Barcode downloaded as SVG')
      recordToHistory()
    })
  }

  const handleReset = () => {
    setPendingChanges((prev) => ({
      ...prev,
      mode: 'product',
      productId: '',
      barcode: '',
      label: '',
      price: '',
      showPriceOnLabel: false,
      quantityLabel: '',
      showQuantityOnLabel: false,
      copies: '1',
    }))
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        icon={HiOutlinePrinter}
        iconClassName="from-violet-500 to-fuchsia-600 shadow-fuchsia-600/25"
        title="Barcode Studio"
        description="Select a product or enter a name manually — barcodes are generated automatically and must be unique."
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-5 sm:p-6 xl:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={switchToProduct}
              className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors ${
                mode === 'product'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}
            >
              From product
            </button>
            <button
              type="button"
              onClick={switchToManual}
              className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors ${
                mode === 'manual'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}
            >
              Manual entry
            </button>
          </div>

          {mode === 'product' ? (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Product</label>
              <p className="text-xs text-slate-400 mb-1.5">Pick from inventory — barcode, name, and price fill automatically</p>
              <select
                value={productId}
                onChange={(e) => patchPendingChanges({ productId: e.target.value })}
                className="field-select"
              >
                <option value="">Select a product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.barcode}) — {currency}{Number(p.price).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <Input
                label="Product name"
                hint="Required — a unique barcode is generated automatically"
                value={label}
                onChange={(e) => patchPendingChanges({ label: e.target.value })}
                placeholder="e.g. Rice 1kg"
              />
              <Input
                label={`Price (${currency})`}
                hint="Optional — shown on label when enabled below"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => patchPendingChanges({ price: e.target.value })}
                placeholder="0.00"
              />
              <Input
                label="Quantity / pack size"
                hint="Optional — e.g. 1kg, 500g, half kg (shown on label when enabled)"
                value={quantityLabel}
                onChange={(e) => patchPendingChanges({ quantityLabel: e.target.value })}
                placeholder="e.g. 1kg"
              />
              {barcodeValue && (
                <div className="rounded-md border border-teal-100 bg-teal-50/50 p-3 text-sm">
                  <p className="text-slate-600">
                    <span className="font-semibold text-slate-800">Generated barcode:</span>{' '}
                    <span className="font-mono text-teal-800">{barcodeValue}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Unique and not used by any product in inventory.</p>
                </div>
              )}
            </>
          )}

          {mode === 'product' && selectedProduct && (
            <div className="rounded-md border border-violet-100 bg-violet-50/50 p-3 text-sm text-slate-600 space-y-1">
              <p><span className="font-semibold text-slate-800">Barcode:</span> <span className="font-mono">{barcodeValue || '—'}</span></p>
              <p><span className="font-semibold text-slate-800">Name:</span> {barcodeLabel || '—'}</p>
              <p><span className="font-semibold text-slate-800">Price:</span> {price !== '' ? formatPrice(currency, price) : '—'}</p>
              {quantityLabel.trim() && (
                <p><span className="font-semibold text-slate-800">Pack size:</span> {quantityLabel.trim()}</p>
              )}
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showQuantityOnLabel}
              onChange={(e) => patchPendingChanges({ showQuantityOnLabel: e.target.checked })}
              className="w-4 h-4 rounded border-teal-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm font-semibold text-slate-700">Show quantity / pack size on label (optional)</span>
          </label>

          {showQuantityOnLabel && mode === 'product' && (
            <Input
              label="Quantity / pack size override"
              hint="Type pack size for this label — e.g. 1kg, 500g, half kg"
              value={quantityLabel}
              onChange={(e) => patchPendingChanges({ quantityLabel: e.target.value })}
              placeholder="e.g. 1kg, half kg"
            />
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showPriceOnLabel}
              onChange={(e) => patchPendingChanges({ showPriceOnLabel: e.target.checked })}
              className="w-4 h-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
            />
            <span className="text-sm font-semibold text-slate-700">Show price on label (optional)</span>
          </label>

          {showPriceOnLabel && mode === 'product' && (
            <Input
              label={`Price override (${currency})`}
              hint="Leave as-is to use the product price, or edit before printing"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => patchPendingChanges({ price: e.target.value })}
              placeholder="0.00"
            />
          )}

          <Input
            label="Copies"
            type="number"
            min="1"
            max="200"
            value={copies}
            onChange={(e) => patchPendingChanges({ copies: e.target.value })}
          />

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handlePrint} loading={printing}>
              <HiOutlinePrinter className="w-4 h-4" />
              Print barcodes
            </Button>
            <Button type="button" variant="secondary" onClick={handleDownloadPng} loading={downloadingPng}>
              <HiOutlineDownload className="w-4 h-4" />
              Download PNG
            </Button>
            <Button type="button" variant="outline" onClick={handleDownloadSvg} loading={downloadingSvg}>
              <HiOutlineDownload className="w-4 h-4" />
              Download SVG
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <HiOutlineSparkles className="w-4 h-4 text-fuchsia-500" />
            Preview
          </h2>
          <div className="rounded-md border-2 border-violet-200 bg-white p-4">
            {(barcodeLabel || priceText || qtyText) && (
              <div className="mb-2">
                <LabelMeta label={barcodeLabel} priceText={priceText} qtyText={qtyText} />
              </div>
            )}
            {barcodeValue ? (
              <svg ref={svgRef} className="w-full" />
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">
                {mode === 'product'
                  ? 'Select a product to preview'
                  : label.trim()
                    ? 'Generating barcode…'
                    : 'Enter a product name to generate a barcode'}
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Previously generated</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Barcodes you printed or downloaded — click to load and print again.
            </p>
          </div>
          {history.length > 0 && (
            <p className="text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
              {history.length} saved
            </p>
          )}
        </div>

        {history.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 py-12 px-4 text-center">
            <p className="text-slate-500 text-sm">No saved barcodes yet.</p>
            <p className="text-slate-400 text-xs mt-1">
              Print or download a label above — it will appear here automatically.
            </p>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {historyPagination.paginatedItems.map((item) => (
              <BarcodeHistoryCard
                key={item.id}
                item={item}
                currency={currency}
                onSelect={loadFromHistory}
                onDelete={handleDeleteHistory}
              />
            ))}
          </div>
          <Pagination
            page={historyPagination.page}
            totalPages={historyPagination.totalPages}
            totalItems={historyPagination.totalItems}
            startIndex={historyPagination.startIndex}
            endIndex={historyPagination.endIndex}
            onPageChange={historyPagination.setPage}
          />
          </>
        )}
      </Card>
    </div>
  )
}
