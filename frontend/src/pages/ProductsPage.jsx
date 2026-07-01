import { useEffect, useMemo, useCallback } from 'react'
import { HiOutlinePlusCircle, HiOutlineSearch, HiOutlineX, HiOutlineQrcode } from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import FilterSelect from '../components/common/FilterSelect'
import ProductDialog from '../components/products/ProductDialog'
import ProductTable from '../components/products/ProductTable'
import { useStore } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'
import { useAsyncAction, delay } from '../hooks/useAsyncAction'
import { useHardwareScanner } from '../hooks/useHardwareScanner'
import { usePendingChanges } from '../hooks/usePendingChanges'
import { lookupBarcodeProduct } from '../utils/barcodeLookup'

import { getProductBatches } from '../utils/productBatches'

function filterProducts(products, { search, groupFilter, batchFilter }) {
  const q = search.trim().toLowerCase()
  const batchQ = (batchFilter || '').trim().toLowerCase()
  return products.filter((p) => {
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.barcode.includes(search.trim()) ||
      String(p.hsn || '').includes(search.trim())
    const matchGroup = !groupFilter || p.groupId === groupFilter
    const matchBatch =
      !batchQ ||
      getProductBatches(p).some((b) => b.name.toLowerCase().includes(batchQ))
    return matchSearch && matchGroup && matchBatch
  })
}

const INITIAL = {
  search: '',
  groupFilter: '',
  batchFilter: '',
  editing: null,
  showForm: false,
  scanPrefill: null,
  scanValue: '',
  scanLoading: false,
  deleteConfirm: null,
}

export default function ProductsPage() {
  const { products, groups, addProduct, updateProduct, deleteProduct, getProductByBarcode } = useStore()
  const { showToast } = useToast()
  const { loading: deleting, run: runDelete } = useAsyncAction()
  const { pendingChanges, patchPendingChanges } = usePendingChanges(INITIAL)
  const {
    search,
    groupFilter,
    batchFilter,
    editing,
    showForm,
    scanPrefill,
    scanValue,
    scanLoading,
    deleteConfirm,
  } = pendingChanges

  const openAddProduct = () => {
    patchPendingChanges({ showForm: true, editing: null, scanPrefill: null })
  }

  const closeProductDialog = () => {
    patchPendingChanges({ showForm: false, editing: null, scanPrefill: null })
  }

  const handleProductScan = useCallback(async (code) => {
    const trimmed = String(code || '').trim()
    if (!trimmed) return
    patchPendingChanges({ scanValue: '' })

    const existing = getProductByBarcode(trimmed)
    if (existing) {
      patchPendingChanges({ showForm: false, scanPrefill: null, editing: existing })
      showToast(`Found ${existing.name} — opening edit`, 'info')
      return
    }

    patchPendingChanges({ scanLoading: true })
    try {
      const found = await lookupBarcodeProduct(trimmed)
      patchPendingChanges({
        scanPrefill: found || { barcode: trimmed },
        editing: null,
        showForm: true,
      })
      showToast(
        found
          ? `Loaded ${found.name} from barcode — review prices and save`
          : 'New barcode — enter product details and save',
        'info'
      )
    } finally {
      patchPendingChanges({ scanLoading: false })
    }
  }, [getProductByBarcode, showToast, patchPendingChanges])

  const handleAdd = async (data) => {
    const id = await addProduct(data)
    if (!id) {
      showToast('Barcode already exists — use a unique barcode', 'error')
      return
    }
    patchPendingChanges({ showForm: false, scanPrefill: null })
    showToast(`${data.name} added to your inventory`)
  }

  const handleUpdate = async (data) => {
    if (editing) {
      const result = await updateProduct(editing.id, data)
      if (!result?.ok) {
        showToast(result?.error || 'Could not update product — please try again', 'error')
        return
      }
      patchPendingChanges({ editing: null, showForm: false })
      showToast(`${editing.name} updated successfully`)
    }
  }

  const handleDelete = (product) => {
    patchPendingChanges({ deleteConfirm: product })
  }

  const confirmDelete = () => {
    if (!deleteConfirm) return
    runDelete(async () => {
      await delay(300)
      await deleteProduct(deleteConfirm.id)
      showToast(`${deleteConfirm.name} removed`, 'info')
      patchPendingChanges({ deleteConfirm: null })
    })
  }

  useEffect(() => {
    if (!deleteConfirm) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') patchPendingChanges({ deleteConfirm: null })
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [deleteConfirm, patchPendingChanges])

  const productModalOpen = showForm || !!editing

  useHardwareScanner(handleProductScan, {
    active: !productModalOpen && !deleteConfirm,
  })

  const hasActiveFilters = Boolean(search.trim() || groupFilter || batchFilter)

  const filteredCount = useMemo(
    () => filterProducts(products, { search, groupFilter, batchFilter }).length,
    [products, search, groupFilter, batchFilter]
  )

  const clearFilters = () => {
    patchPendingChanges({ search: '', groupFilter: '', batchFilter: '' })
  }

  return (
    <div className="h-full max-h-full flex flex-col min-h-0 overflow-hidden">
      <ProductDialog
        open={productModalOpen}
        product={editing}
        prefill={scanPrefill}
        onSubmit={editing ? handleUpdate : handleAdd}
        onCancel={closeProductDialog}
      />

      <Card className="p-3 sm:p-4 flex-1 flex flex-col min-h-0 gap-3 overflow-hidden">
        <div className="shrink-0 space-y-2">
          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 min-w-0 items-end">
              <Input
                label="Search"
                type="search"
                icon={HiOutlineSearch}
                placeholder="Name, barcode, or HSN..."
                value={search}
                onChange={(e) => patchPendingChanges({ search: e.target.value })}
              />
              <FilterSelect
                label="Category"
                id="product-category-filter"
                value={groupFilter}
                onChange={(e) => patchPendingChanges({ groupFilter: e.target.value })}
              >
                <option value="">All categories</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </FilterSelect>
              <Input
                label="Batch"
                type="search"
                icon={HiOutlineSearch}
                placeholder="Filter by batch..."
                value={batchFilter}
                onChange={(e) => patchPendingChanges({ batchFilter: e.target.value })}
              />
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Scan barcode</label>
                <div className="flex gap-2 items-center">
                  <Input
                    icon={HiOutlineQrcode}
                    value={scanValue}
                    onChange={(e) => patchPendingChanges({ scanValue: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleProductScan(scanValue)
                      }
                    }}
                    placeholder="Scan or type..."
                    data-barcode-input
                    className="flex-1 min-w-0"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleProductScan(scanValue)}
                    loading={scanLoading}
                    className="shrink-0 !px-3"
                  >
                    Scan
                  </Button>
                </div>
              </div>
            </div>
            <div className="shrink-0 w-full lg:w-auto">
              <label
                className="hidden lg:block text-sm font-semibold text-slate-700 mb-1.5 invisible select-none"
                aria-hidden="true"
              >
                Action
              </label>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center justify-center gap-1 h-[42px] text-xs font-semibold text-slate-500 hover:text-violet-700 transition-colors cursor-pointer px-2"
                  >
                    <HiOutlineX className="w-3.5 h-3.5" />
                    Clear
                  </button>
                )}
                <Button
                  onClick={openAddProduct}
                  className="flex items-center gap-2 whitespace-nowrap !h-[42px] !py-0 w-full lg:w-auto"
                  aria-haspopup="dialog"
                  aria-expanded={productModalOpen}
                >
                  <HiOutlinePlusCircle className="w-5 h-5" />
                  Add product
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            {filteredCount} of {products.length} products
          </p>
        </div>

        <ProductTable
          className="flex-1 min-h-0 w-full"
          products={products}
          onEdit={(product) => patchPendingChanges({ editing: product })}
          onDelete={handleDelete}
          search={search}
          groupFilter={groupFilter || undefined}
          batchFilter={batchFilter || undefined}
        />
      </Card>

      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <Card className="p-6 max-w-sm w-full shadow-2xl">
            <h3 id="delete-dialog-title" className="text-lg font-bold text-slate-900 mb-2">Delete product?</h3>
            <p className="text-slate-500 text-sm mb-5 leading-relaxed">
              &quot;{deleteConfirm.name}&quot; will be removed. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => patchPendingChanges({ deleteConfirm: null })} disabled={deleting}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete} loading={deleting}>Delete</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
