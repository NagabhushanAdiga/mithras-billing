import { useMemo } from 'react'
import {
  HiOutlineReceiptRefund,
  HiOutlinePrinter,
  HiOutlineEye,
  HiOutlineSearch,
} from 'react-icons/hi'
import Card from '../components/common/Card'
import Input from '../components/common/Input'
import FilterSelect from '../components/common/FilterSelect'
import Pagination from '../components/common/Pagination'
import TableIdentityCell from '../components/common/TableIdentityCell'
import ReceiptBillModal from '../components/billing/ReceiptBillModal'
import { useStore } from '../context/StoreContext'
import { useAuth, filterOrdersForUser } from '../context/AuthContext'
import { isAdminRole } from '../utils/roles'
import { useToast } from '../context/ToastContext'
import { usePagination } from '../hooks/usePagination'
import { usePendingChanges } from '../hooks/usePendingChanges'

const INITIAL = { detailOrder: null, printingId: null, search: '', billerFilter: '' }
import { generateInvoicePdfForPrint } from '../utils/generateInvoicePdf'

const UNKNOWN_BILLER = '__unknown__'

function formatDateTime(iso) {
  const d = new Date(iso)
  return {
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
  }
}

function customerLabel(order) {
  const name = order.customerName?.trim()
  const mobile = order.customerMobile?.trim()
  if (name) return name
  if (mobile) return mobile
  return 'Walk-in customer'
}

function billerLabel(order) {
  const by = order.createdBy
  if (!by) return 'Unknown'
  return by.name || by.username || 'Unknown'
}

const iconBtnClass =
  'flex items-center justify-center w-9 h-9 rounded-md transition-colors cursor-pointer'

function BillRow({ order, currency, onViewDetails, onReprint, printing, showBiller }) {
  const label = customerLabel(order)
  const { time, date } = formatDateTime(order.date)
  const biller = billerLabel(order)
  const billerRole = order.createdBy?.role

  return (
    <tr className="border-b border-slate-300 hover:bg-slate-50/80">
      <td className="py-3.5 px-2 min-w-[180px]">
        <TableIdentityCell
          title={label}
          subtitle={order.id}
          name={label}
          avatarFallback="W"
        />
        {showBiller && (
          <p className="text-xs text-slate-500 mt-1.5 sm:hidden pl-12">
            Billed by <span className="font-semibold text-slate-700">{biller}</span>
            {billerRole ? ` · ${billerRole}` : ''}
          </p>
        )}
      </td>
      {showBiller && (
        <td className="py-3.5 px-2 min-w-[120px] hidden sm:table-cell">
          <p className="text-slate-800 text-sm font-semibold truncate">{biller}</p>
          <p className="text-slate-400 text-xs mt-0.5 capitalize truncate">
            {billerRole || 'staff'}
          </p>
        </td>
      )}
      <td className="py-3.5 px-2 text-left sm:text-right whitespace-nowrap">
        <p className="text-slate-900 font-bold text-sm tabular-nums">{time}</p>
        <p className="text-slate-400 text-xs mt-0.5 hidden sm:block">{date}</p>
      </td>
      <td className="py-3.5 px-2 text-right whitespace-nowrap">
        <span className="text-emerald-600 font-extrabold text-base sm:text-lg tabular-nums">
          {currency}{Number(order.total).toFixed(2)}
        </span>
      </td>
      <td className="py-3.5 px-2">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onViewDetails(order)}
            className={`${iconBtnClass} text-slate-500 hover:text-violet-700 hover:bg-violet-50`}
            title="View invoice"
            aria-label={`View invoice ${order.id}`}
          >
            <HiOutlineEye className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => onReprint(order)}
            disabled={printing}
            className={`${iconBtnClass} text-slate-500 hover:text-sky-700 hover:bg-sky-50 disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Print invoice"
            aria-label={`Print ${order.id}`}
          >
            <HiOutlinePrinter className={`w-5 h-5 ${printing ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function RecentlyBilledPage() {
  const { orders, settings } = useStore()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { pendingChanges, patchPendingChanges } = usePendingChanges(INITIAL)
  const { detailOrder, printingId, search, billerFilter } = pendingChanges
  const currency = settings?.currency || '₹'
  const isAdmin = isAdminRole(user?.role)

  const visibleOrders = useMemo(
    () => filterOrdersForUser(orders, user),
    [orders, user]
  )

  const billerOptions = useMemo(() => {
    if (!isAdmin) return []
    const byId = new Map()
    let hasUnknown = false
    visibleOrders.forEach((order) => {
      const by = order.createdBy
      if (!by?.id) {
        hasUnknown = true
        return
      }
      byId.set(by.id, {
        id: by.id,
        label: by.name || by.username,
      })
    })
    const list = Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label))
    if (hasUnknown) {
      list.unshift({ id: UNKNOWN_BILLER, label: 'Unknown' })
    }
    return list
  }, [visibleOrders, isAdmin])

  const filteredOrders = useMemo(() => {
    let list = visibleOrders
    if (isAdmin && billerFilter) {
      if (billerFilter === UNKNOWN_BILLER) {
        list = list.filter((order) => !order.createdBy?.id)
      } else {
        list = list.filter((order) => order.createdBy?.id === billerFilter)
      }
    }
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((order) => {
      const name = customerLabel(order).toLowerCase()
      const mobile = String(order.customerMobile || '').trim().toLowerCase()
      const billId = String(order.id || '').toLowerCase()
      const biller = billerLabel(order).toLowerCase()
      const billerUsername = String(order.createdBy?.username || '').toLowerCase()
      return (
        name.includes(q) ||
        mobile.includes(q) ||
        billId.includes(q) ||
        biller.includes(q) ||
        billerUsername.includes(q)
      )
    })
  }, [visibleOrders, search, isAdmin, billerFilter])

  const {
    paginatedItems,
    page,
    setPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filteredOrders, { resetDeps: [search, billerFilter] })

  const closeInvoice = () => {
    patchPendingChanges({ detailOrder: null })
  }

  const handlePreview = (order) => {
    patchPendingChanges({ detailOrder: order })
  }

  const handlePrint = async (order) => {
    if (printingId) return
    patchPendingChanges({ printingId: order.id })
    try {
      await generateInvoicePdfForPrint(settings, order)
      showToast('Print dialog opened')
    } catch {
      showToast('Could not print bill', 'error')
    } finally {
      patchPendingChanges({ printingId: null })
    }
  }

  return (
    <div className="h-full max-h-full flex flex-col min-h-0 overflow-hidden">
      <Card className="p-3 sm:p-4 flex-1 flex flex-col min-h-0 gap-3 overflow-hidden">
        {visibleOrders.length === 0 ? (
          <div className="flex-1 flex items-center justify-center rounded-md border border-dashed border-violet-200 py-16 px-4 text-center bg-violet-50/30">
            <div>
              <div className="inline-flex w-14 h-14 rounded-md bg-violet-50 items-center justify-center mb-3">
                <HiOutlineReceiptRefund className="w-7 h-7 text-violet-500" />
              </div>
              <p className="text-slate-500 text-sm font-medium">No bills yet.</p>
              <p className="text-slate-400 text-xs mt-1">Bills appear here after you generate them from POS.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <Input
                label="Search"
                type="search"
                icon={HiOutlineSearch}
                placeholder={
                  isAdmin
                    ? 'Customer, bill ID, or cashier...'
                    : 'Name, mobile, or bill ID...'
                }
                value={search}
                onChange={(e) => patchPendingChanges({ search: e.target.value })}
              />
              {isAdmin && (
                <FilterSelect
                  label="Cashier"
                  id="recent-bills-cashier-filter"
                  value={billerFilter}
                  onChange={(e) => patchPendingChanges({ billerFilter: e.target.value })}
                >
                  <option value="">All cashiers</option>
                  {billerOptions.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </FilterSelect>
              )}
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              {filteredOrders.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-slate-500 text-sm text-center py-12 border border-dashed border-slate-200 rounded-md px-6">
                    No bills match this search.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-h-0 overflow-auto rounded-md border border-violet-100 min-w-0 shadow-sm">
                    <table className="w-full text-left min-w-[560px]">
                      <thead className="hidden sm:table-header-group bg-gradient-to-r from-violet-50 to-fuchsia-50 sticky top-0 z-10 border-b border-violet-200">
                        <tr className="text-xs font-bold uppercase tracking-wider text-violet-700">
                          <th className="pb-2 px-2 font-bold">Customer / Bill ID</th>
                          {isAdmin && <th className="pb-2 px-2 font-bold">Billed by</th>}
                          <th className="pb-2 px-2 font-bold text-right">Time</th>
                          <th className="pb-2 px-2 font-bold text-right">Total</th>
                          <th className="pb-2 px-2 font-bold text-right w-24">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedItems.map((order) => (
                          <BillRow
                            key={order.id}
                            order={order}
                            currency={currency}
                            onViewDetails={handlePreview}
                            onReprint={handlePrint}
                            printing={printingId === order.id}
                            showBiller={isAdmin}
                          />
                        ))}
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
                </>
              )}
            </div>
          </>
        )}
      </Card>

      <ReceiptBillModal
        open={!!detailOrder}
        order={detailOrder}
        settings={settings}
        onClose={closeInvoice}
      />
    </div>
  )
}
