import { useMemo, useEffect, useCallback } from 'react'
import { HiOutlineQrcode } from 'react-icons/hi'
import Button from '../common/Button'
import Input from '../common/Input'
import ImageField from './ImageField'
import ProductBatchesEditor from './ProductBatchesEditor'
import { useStore } from '../../context/StoreContext'
import { isBarcodeTaken, generateUniqueBarcode } from '../../utils/barcode'
import { lookupBarcodeProduct } from '../../utils/barcodeLookup'
import {
  applyBatchesToProduct,
  batchesToFormRows,
  batchRowFromLookup,
  emptyBatchRow,
  parseFormBatches,
} from '../../utils/productBatches'
import { getSubcategoriesForGroup } from '../../utils/categories'
import { formatProductDiscount, clampDiscount, normalizeGst } from '../../utils/billing'
import { usePendingChanges } from '../../hooks/usePendingChanges'

const FORM_ID = 'product-form'

const INITIAL_PRODUCT_FORM = {
  barcode: '',
  name: '',
  hsn: '',
  gst: '',
  groupId: '',
  subcategoryId: '',
  image: '',
  discount: '',
  batchRows: [emptyBatchRow({ name: 'batch 1' })],
  errors: {},
  lookupLoading: false,
  lookupNote: '',
}

function normalizeHsn(value) {
  return String(value || '').trim().replace(/\s/g, '')
}

export default function ProductForm({
  product,
  prefill,
  onSubmit,
  onCancel,
  inSlider = false,
  formId = FORM_ID,
}) {
  const { groups, products, batches: batchesCatalog, settings } = useStore()
  const { pendingChanges, setPendingChanges, patchPendingChanges } = usePendingChanges(INITIAL_PRODUCT_FORM)
  const {
    barcode,
    name,
    hsn,
    gst,
    groupId,
    subcategoryId,
    image,
    discount,
    batchRows,
    errors,
    lookupLoading,
    lookupNote,
  } = pendingChanges
  const isEditing = Boolean(product)

  const discountType = settings?.discountType ?? 'percent'
  const currency = settings?.currency ?? '₹'
  const maxDiscountPercent = settings?.maxDiscountPercent ?? 50
  const defaultTaxRate = settings?.taxRate ?? 5
  const subcategoryOptions = useMemo(
    () => getSubcategoriesForGroup(groups, groupId),
    [groups, groupId]
  )

  const applyPrefill = useCallback((data) => {
    if (!data || isEditing) return
    const updates = {}
    if (data.barcode) updates.barcode = String(data.barcode)
    if (data.name) updates.name = String(data.name)
    if (data.image) updates.image = data.image
    if (data.mrp || data.sellingPrice || data.costPrice) {
      updates.batchRows = [batchRowFromLookup(data)]
    }
    updates.lookupNote = data.name
      ? 'Product details loaded from barcode — review prices and quantity.'
      : ''
    patchPendingChanges(updates)
  }, [isEditing, patchPendingChanges])

  useEffect(() => {
    if (product) {
      patchPendingChanges({
        barcode: product.barcode || '',
        name: product.name || '',
        hsn: product.hsn || '',
        gst: product.gst != null && product.gst !== '' ? String(product.gst) : '',
        groupId: product.groupId || '',
        subcategoryId: product.subcategoryId || '',
        image: product.image || '',
        discount: product.discount ? String(product.discount) : '',
        batchRows: batchesToFormRows(product, batchesCatalog),
        lookupNote: '',
        errors: {},
      })
    } else {
      patchPendingChanges({
        ...INITIAL_PRODUCT_FORM,
        batchRows: [emptyBatchRow({ name: 'batch 1' })],
        errors: {},
      })
      if (prefill) applyPrefill(prefill)
    }
  }, [product, groups, batchesCatalog, prefill, applyPrefill, patchPendingChanges])

  const runBarcodeLookup = async (code) => {
    const trimmed = String(code || '').trim()
    if (!trimmed || isEditing) return

    if (isBarcodeTaken(products, trimmed)) {
      patchPendingChanges({ lookupNote: 'This barcode is already in your product list.' })
      return
    }

    patchPendingChanges({ lookupLoading: true, lookupNote: 'Looking up product…' })
    try {
      const found = await lookupBarcodeProduct(trimmed)
      if (found) {
        applyPrefill(found)
      } else {
        patchPendingChanges({
          lookupNote: 'Barcode saved — enter product name and prices manually.',
          barcode: trimmed,
        })
      }
    } catch {
      patchPendingChanges({
        lookupNote: 'Could not look up barcode — enter details manually.',
        barcode: trimmed,
      })
    } finally {
      patchPendingChanges({ lookupLoading: false })
    }
  }

  const handleBarcodeSubmit = () => {
    const trimmed = barcode.trim()
    if (!trimmed) return
    if (isBarcodeTaken(products, trimmed, product?.id)) {
      setPendingChanges((prev) => ({
        ...prev,
        errors: { ...prev.errors, barcode: 'This barcode is already used' },
      }))
      return
    }
    runBarcodeLookup(trimmed)
  }

  const handleRegenerateBarcode = () => {
    patchPendingChanges({
      barcode: generateUniqueBarcode(products),
      lookupNote: 'Internal barcode generated — for products without a package barcode.',
    })
    setPendingChanges((prev) => ({
      ...prev,
      errors: { ...prev.errors, barcode: '' },
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const nextErrors = {}

    let finalBarcode = barcode.trim()
    if (isEditing) {
      finalBarcode = product.barcode
    } else {
      if (!finalBarcode) {
        nextErrors.barcode = 'Scan or enter the package barcode'
      } else if (isBarcodeTaken(products, finalBarcode)) {
        nextErrors.barcode = 'This barcode is already used by another product'
      }
    }

    if (!isEditing && !name.trim()) {
      nextErrors.name = 'Please enter a product name'
    }

    const hsnCode = normalizeHsn(hsn)
    if (hsnCode && !/^\d{4,8}$/.test(hsnCode)) {
      nextErrors.hsn = 'HSN must be 4 to 8 digits'
    }

    const gstNum = gst === '' ? undefined : Number(gst)
    if (gst !== '' && (isNaN(gstNum) || gstNum < 0 || gstNum > 100)) {
      nextErrors.gst = 'GST must be between 0 and 100'
    }

    const { batches, errors: batchErrors } = parseFormBatches(batchRows)
    Object.assign(nextErrors, batchErrors)

    const discountNum = discount === '' ? 0 : Number(discount)
    if (discount !== '' && (isNaN(discountNum) || discountNum < 0)) {
      nextErrors.discount = 'Enter a valid discount'
    }

    if (Object.keys(nextErrors).length > 0) {
      patchPendingChanges({ errors: nextErrors })
      return
    }

    const sampleLine = {
      price: batches[0]?.sellingPrice ?? 0,
      mrp: batches[0]?.mrp ?? batches[0]?.sellingPrice ?? 0,
      qty: 1,
      discount: discountNum,
    }
    const clampedDiscount = clampDiscount(discountNum, discountType, sampleLine, maxDiscountPercent)

    patchPendingChanges({ errors: {} })
    const basePayload = {
      hsn: hsnCode,
      gst: normalizeGst(gstNum),
      groupId: groupId || '',
      subcategoryId: subcategoryId || '',
      image: image || undefined,
      discount: clampedDiscount,
    }
    if (!isEditing) {
      basePayload.barcode = finalBarcode
      basePayload.name = name.trim()
    }
    const payload = applyBatchesToProduct(basePayload, batches)
    onSubmit(payload)
  }

  const clearFieldError = (field) => {
    setPendingChanges((prev) => ({
      ...prev,
      errors: { ...prev.errors, [field]: '' },
    }))
  }

  const formFields = (
    <>
      <ImageField
        image={image}
        name={name}
        onChange={(value) => patchPendingChanges({ image: value })}
      />
      {isEditing ? (
        <Input
          label="Barcode"
          hint="Cannot be changed after creation — used for POS scanning"
          value={barcode}
          readOnly
          inputClassName="!font-mono !bg-slate-50 !text-slate-700"
        />
      ) : (
        <div className="space-y-2">
          <Input
            label="Barcode"
            hint="Scan package barcode (e.g. Maggi) or type and press Enter"
            icon={HiOutlineQrcode}
            value={barcode}
            onChange={(e) => {
              patchPendingChanges({ barcode: e.target.value })
              clearFieldError('barcode')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleBarcodeSubmit()
              }
            }}
            placeholder="Scan or enter barcode"
            error={errors.barcode}
            data-barcode-input
            required
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleBarcodeSubmit}
              loading={lookupLoading}
              className="!py-2"
            >
              Load product details
            </Button>
            <Button type="button" variant="outline" onClick={handleRegenerateBarcode} className="!py-2">
              Generate internal barcode
            </Button>
          </div>
          {lookupNote ? (
            <p className="text-xs text-violet-700 bg-violet-50 border border-violet-100 rounded-md px-3 py-2">
              {lookupNote}
            </p>
          ) : null}
        </div>
      )}
      <Input
        label="Product name"
        value={name}
        onChange={(e) => {
          patchPendingChanges({ name: e.target.value })
          clearFieldError('name')
        }}
        placeholder="e.g. Maggi 2-Minute Noodles 70g"
        hint={isEditing ? 'Cannot be changed after creation' : undefined}
        readOnly={isEditing}
        inputClassName={isEditing ? '!bg-slate-50 !text-slate-700' : undefined}
        error={errors.name}
        required={!isEditing}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        <Input
          label="HSN code"
          hint="4–8 digits (optional)"
          value={hsn}
          onChange={(e) => {
            patchPendingChanges({ hsn: e.target.value.replace(/[^\d\s]/g, '') })
            clearFieldError('hsn')
          }}
          placeholder="e.g. 1902"
          inputClassName="!font-mono"
          error={errors.hsn}
        />
        <div>
          <Input
            label="GST %"
            hint={`Blank = store default (${defaultTaxRate}%)`}
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={gst}
            onChange={(e) => {
              patchPendingChanges({ gst: e.target.value })
              clearFieldError('gst')
            }}
            placeholder="e.g. 5"
            error={errors.gst}
          />
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {[0, 5, 12, 18, 28].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => {
                  patchPendingChanges({ gst: String(rate) })
                  clearFieldError('gst')
                }}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                  Number(gst) === rate
                    ? 'bg-blue-100 border-blue-300 text-blue-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50'
                }`}
              >
                {rate}%
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                patchPendingChanges({ gst: '' })
                clearFieldError('gst')
              }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                gst === ''
                  ? 'bg-blue-100 border-blue-300 text-blue-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50'
              }`}
            >
              Default
            </button>
          </div>
        </div>
      </div>
      <ProductBatchesEditor
        rows={batchRows}
        onChange={(rows) => patchPendingChanges({ batchRows: rows })}
        errors={errors}
        currency={currency}
      />
      <Input
        label={`Discount per unit (${discountType === 'percent' ? '% of MRP' : `${currency} off MRP each`})`}
        hint="Calculated on MRP at POS — applied per item, not on total quantity"
        type="number"
        step={discountType === 'percent' ? '1' : '0.01'}
        min="0"
        max={discountType === 'percent' ? String(maxDiscountPercent) : undefined}
        value={discount}
        onChange={(e) => {
          patchPendingChanges({ discount: e.target.value })
          clearFieldError('discount')
        }}
        placeholder="0"
        error={errors.discount}
      />
      {Number(discount) > 0 ? (
        <p className="text-xs text-slate-500 -mt-2">
          At POS: {formatProductDiscount(Number(discount), discountType, currency)} per unit sold
        </p>
      ) : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Category <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <select
            value={groupId}
            onChange={(e) => patchPendingChanges({ groupId: e.target.value, subcategoryId: '' })}
            className="field-select"
          >
            <option value="">No category</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Subcategory <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <select
            value={subcategoryId}
            onChange={(e) => patchPendingChanges({ subcategoryId: e.target.value })}
            className="field-select"
            disabled={!groupId || subcategoryOptions.length === 0}
          >
            <option value="">
              {!groupId
                ? 'Select a category first'
                : subcategoryOptions.length === 0
                  ? 'No subcategories — add in Categories'
                  : 'No subcategory'}
            </option>
            {subcategoryOptions.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  )

  if (inSlider) {
    return (
      <form id={formId} onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        {formFields}
      </form>
    )
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
      {formFields}
    </form>
  )
}

export { FORM_ID as PRODUCT_FORM_ID }
