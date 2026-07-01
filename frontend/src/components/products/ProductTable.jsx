import { useMemo } from 'react'
import { HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi'
import Button from '../common/Button'
import Pagination from '../common/Pagination'
import TableIdentityCell from '../common/TableIdentityCell'
import { usePagination } from '../../hooks/usePagination'
import { useStore } from '../../context/StoreContext'
import {
  formatBatchSummary,
  formatPriceRange,
  formatMrpRange,
  getProductBatches,
  getTotalStock,
} from '../../utils/productBatches'
import { formatProductDiscount } from '../../utils/billing'

const GROUP_BADGE_COLORS = [
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-sky-100 text-sky-700 border-sky-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
]

export default function ProductTable({ products, onEdit, onDelete, search, groupFilter, batchFilter, className = '' }) {
  const { settings, getGroupById } = useStore()
  const currency = settings?.currency || '₹'
  const discountType = settings?.discountType ?? 'percent'
  const batchQuery = (batchFilter || '').trim().toLowerCase()

  const filtered = useMemo(() => products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      String(p.hsn || '').includes(search)
    const matchGroup = !groupFilter || p.groupId === groupFilter
    const matchBatch =
      !batchQuery ||
      getProductBatches(p).some((b) => b.name.toLowerCase().includes(batchQuery))
    return matchSearch && matchGroup && matchBatch
  }), [products, search, groupFilter, batchQuery])

  const {
    paginatedItems,
    page,
    setPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filtered, { resetDeps: [search, groupFilter, batchFilter] })

  if (filtered.length === 0) {
    return (
      <div className={`rounded-md border-2 border-dashed border-violet-200 py-12 px-4 bg-violet-50/30 flex items-center justify-center min-h-[12rem] ${className}`}>
        <p className="text-violet-500 text-center text-sm font-medium">
          {products.length === 0 ? 'No products yet. Add your first product.' : 'No products match the filter.'}
        </p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col min-h-0 ${className}`}>
      <div className="flex-1 min-h-0 overflow-auto rounded-md border border-violet-100 min-w-0 shadow-sm">
        <table className="w-full text-left min-w-[1100px]">
        <thead className="bg-gradient-to-r from-violet-50 to-fuchsia-50 text-violet-700 text-xs font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-violet-200">
          <tr>
            <th className="px-4 py-3.5">Product</th>
            <th className="px-4 py-3.5">HSN</th>
            <th className="px-4 py-3.5">GST</th>
            <th className="px-4 py-3.5">Category</th>
            <th className="px-4 py-3.5">Batches</th>
            <th className="px-4 py-3.5 text-right">Stock</th>
            <th className="px-4 py-3.5 text-right">MRP</th>
            <th className="px-4 py-3.5 text-right">Selling</th>
            <th className="px-4 py-3.5 text-right">Unit discount</th>
            <th className="px-4 py-3.5 w-28 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedItems.map((p, i) => {
            const groupName = getGroupById(p.groupId)?.name
            const categoryLabel = p.category || groupName || '—'
            const batchSummary = formatBatchSummary(p)
            const mrpLabel = formatMrpRange(p, currency)
            const priceLabel = formatPriceRange(p, currency)
            const discountLabel = formatProductDiscount(p.discount, discountType, currency)
            const totalStock = getTotalStock(p)
            const badgeColor = GROUP_BADGE_COLORS[i % GROUP_BADGE_COLORS.length]
            return (
              <tr key={p.id} className="border-b border-slate-300 hover:bg-violet-50/50 transition-colors">
                <td className="px-4 py-3.5">
                  <TableIdentityCell product={p} title={p.name} subtitle={p.barcode} />
                </td>
                <td className="px-4 py-3.5 text-slate-600 text-sm font-mono whitespace-nowrap">
                  {p.hsn || '—'}
                </td>
                <td className="px-4 py-3.5 text-slate-600 text-sm whitespace-nowrap">
                  {p.gst != null && p.gst !== '' ? `${p.gst}%` : '—'}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-md border text-xs font-semibold ${badgeColor}`}>{categoryLabel}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex px-2.5 py-0.5 rounded-md border text-xs font-semibold bg-teal-50 text-teal-700 border-teal-200">
                    {batchSummary}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-slate-700 font-semibold text-sm text-right whitespace-nowrap">
                  {totalStock}
                </td>
                <td className="px-4 py-3.5 text-slate-600 text-sm text-right whitespace-nowrap">{mrpLabel}</td>
                <td className="px-4 py-3.5 text-fuchsia-600 font-bold text-sm text-right whitespace-nowrap">{priceLabel}</td>
                <td className="px-4 py-3.5 text-emerald-700 text-sm text-right whitespace-nowrap">{discountLabel}</td>
                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                  <Button variant="ghost" className="!py-1.5 !px-2 !rounded-md" onClick={() => onEdit(p)} title="Edit">
                    <HiOutlinePencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" className="!py-1.5 !px-2 !rounded-md text-red-400 hover:text-red-600" onClick={() => onDelete(p)} title="Delete">
                    <HiOutlineTrash className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={setPage}
        className="shrink-0 !mt-3 bg-white"
      />
    </div>
  )
}
