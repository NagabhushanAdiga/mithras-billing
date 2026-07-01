import { useMemo, useEffect } from 'react'
import {
  HiOutlineTag,
  HiOutlinePlusCircle,
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlinePencil,
} from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import PageHeader from '../components/common/PageHeader'
import Pagination from '../components/common/Pagination'
import SubcategorySlider from '../components/groups/SubcategorySlider'
import { useStore } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'
import { useAsyncAction, delay } from '../hooks/useAsyncAction'
import { usePagination } from '../hooks/usePagination'
import { usePendingChanges } from '../hooks/usePendingChanges'

const INITIAL = { search: '', groupFilter: '', showSlider: false, editingRow: null, deleteConfirm: null }

export default function SubcategoriesPage() {
  const { groups, products, addSubcategory, updateSubcategory, deleteSubcategory } = useStore()
  const { showToast } = useToast()
  const { loading: deleting, run: runDelete } = useAsyncAction()
  const { pendingChanges, patchPendingChanges } = usePendingChanges(INITIAL)
  const { search, groupFilter, showSlider, editingRow, deleteConfirm } = pendingChanges

  const allSubcategories = useMemo(() => {
    return groups.flatMap((g) =>
      (g.subcategories || []).map((sub) => ({
        ...sub,
        groupId: g.id,
        groupName: g.name,
      }))
    )
  }, [groups])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allSubcategories.filter((row) => {
      const matchSearch =
        !q ||
        row.name.toLowerCase().includes(q) ||
        row.groupName.toLowerCase().includes(q)
      const matchGroup = !groupFilter || row.groupId === groupFilter
      return matchSearch && matchGroup
    })
  }, [allSubcategories, search, groupFilter])

  const {
    paginatedItems,
    page,
    setPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filtered, { resetDeps: [search, groupFilter] })

  const productCountFor = (groupId, subcategoryId) =>
    products.filter((p) => p.groupId === groupId && p.subcategoryId === subcategoryId).length

  const openAdd = () => {
    patchPendingChanges({ editingRow: null, showSlider: true })
  }

  const openEdit = (row) => {
    const parent = groups.find((g) => g.id === row.groupId)
    if (!parent) return
    patchPendingChanges({
      editingRow: { parent, subcategory: { id: row.id, name: row.name } },
      showSlider: true,
    })
  }

  const closeSlider = () => {
    patchPendingChanges({ showSlider: false, editingRow: null })
  }

  const handleSubmit = (groupId, name, subcategory) => {
    if (subcategory) {
      const ok = updateSubcategory(groupId, subcategory.id, name)
      if (!ok) return null
      closeSlider()
      showToast(`Subcategory "${name}" updated`)
      return subcategory.id
    }
    const id = addSubcategory(groupId, name)
    if (!id) return null
    closeSlider()
    showToast(`Subcategory "${name}" added`)
    return id
  }

  const confirmDelete = () => {
    if (!deleteConfirm) return
    runDelete(async () => {
      await delay(300)
      deleteSubcategory(deleteConfirm.groupId, deleteConfirm.id)
      showToast(`Subcategory "${deleteConfirm.name}" deleted`, 'info')
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
    <div className="h-full flex flex-col gap-6 sm:gap-8 min-h-0 overflow-hidden">
      <div className="shrink-0">
      <PageHeader
        icon={HiOutlineTag}
        iconClassName="from-teal-500 to-emerald-600 shadow-teal-600/25"
        title="Subcategories"
        description="Manage subcategories under each category — e.g. Daily products → Milk, Breads."
      >
        <Button onClick={openAdd} className="flex items-center gap-2" disabled={groups.length === 0}>
          <HiOutlinePlusCircle className="w-5 h-5" />
          Add subcategory
        </Button>
      </PageHeader>
      </div>

      <SubcategorySlider
        open={showSlider}
        parentGroup={editingRow?.parent || null}
        subcategory={editingRow?.subcategory || null}
        groups={groups}
        onSubmit={handleSubmit}
        onCancel={closeSlider}
      />

      <Card className="p-5 sm:p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 shrink-0">
          <Input
            type="search"
            icon={HiOutlineSearch}
            label="Search"
            placeholder="Search subcategory or category..."
            value={search}
            onChange={(e) => patchPendingChanges({ search: e.target.value })}
          />
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Parent category
            </label>
            <select
              value={groupFilter}
              onChange={(e) => patchPendingChanges({ groupFilter: e.target.value })}
              className="field-select"
            >
              <option value="">All categories</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="rounded-md border-2 border-dashed border-teal-200 py-16 px-4 text-center bg-teal-50/30 flex-1 flex items-center justify-center">
            <p className="text-slate-500 text-sm font-medium">
              Add a category first, then create subcategories under it.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-md border-2 border-dashed border-teal-200 py-16 px-4 text-center bg-teal-50/30 flex-1 flex items-center justify-center">
            <p className="text-slate-500 text-sm font-medium">
              {allSubcategories.length === 0
                ? 'No subcategories yet. Add your first subcategory.'
                : 'No subcategories match your search.'}
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-auto rounded-md border-2 border-teal-100 shadow-sm">
            <table className="w-full text-left min-w-[560px]">
              <thead className="bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-800 text-xs font-bold uppercase tracking-wider border-b border-teal-200 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3.5">Subcategory</th>
                  <th className="px-4 py-3.5">Parent category</th>
                  <th className="px-4 py-3.5">Products</th>
                  <th className="px-4 py-3.5 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((row, i) => (
                  <tr key={row.id} className="border-b border-slate-300 hover:bg-teal-50/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-slate-900">{row.name}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-md border text-xs font-semibold ${
                        ['bg-violet-100 text-violet-700 border-violet-200', 'bg-sky-100 text-sky-700 border-sky-200', 'bg-amber-100 text-amber-700 border-amber-200'][i % 3]
                      }`}>
                        {row.groupName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border bg-teal-50 text-teal-700 border-teal-200">
                        {productCountFor(row.groupId, row.id)} product{productCountFor(row.groupId, row.id) !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        className="!p-2 !rounded-md"
                        onClick={() => openEdit(row)}
                        title="Edit subcategory"
                      >
                        <HiOutlinePencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="!p-2 !rounded-md text-red-400 hover:text-red-600"
                        onClick={() => patchPendingChanges({ deleteConfirm: row })}
                        title="Delete subcategory"
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
            className="shrink-0 !mt-3 bg-white"
          />
          </div>
        )}
      </Card>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete subcategory?</h3>
            <p className="text-slate-500 text-sm mb-5 leading-relaxed">
              &quot;{deleteConfirm.name}&quot; under {deleteConfirm.groupName} will be removed.
              Products using it will keep the parent category only.
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
