import { useMemo, useEffect } from 'react'
import { HiOutlineArchive, HiOutlinePlusCircle, HiOutlineSearch, HiOutlineTrash } from 'react-icons/hi'
import Card from '../components/common/Card'
import TableIdentityCell from '../components/common/TableIdentityCell'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import BatchSlider from '../components/batches/BatchSlider'
import PageHeader from '../components/common/PageHeader'
import Pagination from '../components/common/Pagination'
import { useStore } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'
import { useAsyncAction, delay } from '../hooks/useAsyncAction'
import { usePagination } from '../hooks/usePagination'
import { usePendingChanges } from '../hooks/usePendingChanges'

const INITIAL = { search: '', showAddSlider: false, deleteConfirm: null }

export default function BatchesPage() {
  const { batches, products, addBatch, deleteBatch } = useStore()
  const { showToast } = useToast()
  const { loading: deleting, run: runDelete } = useAsyncAction()
  const { pendingChanges, patchPendingChanges } = usePendingChanges(INITIAL)
  const { search, showAddSlider, deleteConfirm } = pendingChanges

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return batches
    return batches.filter((b) => b.name.toLowerCase().includes(q))
  }, [batches, search])

  const {
    paginatedItems,
    page,
    setPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filtered, { resetDeps: [search] })

  const productCountFor = (batchId) => products.filter((p) => p.batchId === batchId).length

  const handleAdd = (name) => {
    const id = addBatch(name)
    if (!id) return null
    patchPendingChanges({ showAddSlider: false })
    showToast(`Batch "${name}" created`)
    return id
  }

  const confirmDelete = () => {
    if (!deleteConfirm) return
    runDelete(async () => {
      await delay(300)
      deleteBatch(deleteConfirm.id)
      showToast(`Batch "${deleteConfirm.name}" deleted`, 'info')
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

  return (
    <div className="h-full flex flex-col gap-6 sm:gap-8">
      <PageHeader
        icon={HiOutlineArchive}
        iconClassName="from-teal-500 to-cyan-600 shadow-teal-600/25"
        title="Batches"
        description="Create batches by name — assign to products when adding inventory (optional)."
      >
        <Button onClick={() => patchPendingChanges({ showAddSlider: true })} className="flex items-center gap-2">
          <HiOutlinePlusCircle className="w-5 h-5" />
          Add batch
        </Button>
      </PageHeader>

      <BatchSlider
        open={showAddSlider}
        onSubmit={handleAdd}
        onCancel={() => patchPendingChanges({ showAddSlider: false })}
      />

      <Card className="p-5 sm:p-6 flex-1 flex flex-col min-h-0">
        <div className="mb-5 shrink-0">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Search batches</h2>
          <Input
            type="search"
            icon={HiOutlineSearch}
            placeholder="Search by batch name..."
            value={search}
            onChange={(e) => patchPendingChanges({ search: e.target.value })}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-md border border-dashed border-teal-200 py-16 px-4 text-center bg-teal-50/30 flex-1 flex items-center justify-center">
            <div>
              <div className="inline-flex w-14 h-14 rounded-md bg-teal-50 items-center justify-center mb-3">
                <HiOutlineArchive className="w-7 h-7 text-teal-500" />
              </div>
              <p className="text-slate-500 text-sm font-medium">
                {batches.length === 0 ? 'No batches yet. Add your first batch.' : 'No batches match your search.'}
              </p>
            </div>
          </div>
        ) : (
          <>
          <div className="rounded-md border border-teal-100 overflow-x-auto flex-1 min-h-0 shadow-sm">
            <table className="w-full text-left min-w-[480px]">
              <thead className="bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-800 text-xs font-bold uppercase tracking-wider border-b border-teal-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3.5">Batch</th>
                  <th className="px-4 py-3.5">Products</th>
                  <th className="px-4 py-3.5 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((b, i) => (
                  <tr key={b.id} className="border-b border-slate-300 hover:bg-teal-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <TableIdentityCell title={b.name} subtitle={b.id} name={b.name} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                        ['bg-teal-100 text-teal-700 border-teal-200', 'bg-cyan-100 text-cyan-700 border-cyan-200', 'bg-indigo-100 text-indigo-700 border-indigo-200'][i % 3]
                      }`}>
                        {productCountFor(b.id)} product{productCountFor(b.id) !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        className="!p-2 !rounded-md text-red-400 hover:text-red-600"
                        onClick={() => patchPendingChanges({ deleteConfirm: b })}
                        title="Delete batch"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
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
            className="!mt-0 shrink-0"
          />
          </>
        )}
      </Card>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete batch?</h3>
            <p className="text-slate-500 text-sm mb-5 leading-relaxed">
              &quot;{deleteConfirm.name}&quot; will be removed. Products in this batch will be unassigned.
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
