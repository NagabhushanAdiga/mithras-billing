import { useEffect, useRef } from 'react'
import { HiOutlineCollection } from 'react-icons/hi'
import Input from '../common/Input'
import FormActions from '../common/FormActions'
import SliderPanelHeader from '../common/SliderPanelHeader'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { usePendingChanges } from '../../hooks/usePendingChanges'

const FORM_ID = 'subcategory-form'
const INITIAL = { name: '', selectedGroupId: '', error: '' }

export default function SubcategorySlider({
  open,
  parentGroup,
  subcategory,
  groups = [],
  onSubmit,
  onCancel,
}) {
  const panelRef = useRef(null)
  const { pendingChanges, setPendingChanges, patchPendingChanges } = usePendingChanges(INITIAL)
  const { name, selectedGroupId, error } = pendingChanges
  const { loading, run } = useAsyncAction()
  const isEditing = Boolean(subcategory)
  const needsParentPick = !isEditing && !parentGroup

  useEffect(() => {
    if (open) {
      setPendingChanges({
        name: subcategory?.name || '',
        selectedGroupId: parentGroup?.id || '',
        error: '',
      })
    }
  }, [open, parentGroup, subcategory, setPendingChanges])

  useEffect(() => {
    if (!open) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onCancel])

  useEffect(() => {
    if (open && panelRef.current) {
      const field = panelRef.current.querySelector('form input, form select')
      requestAnimationFrame(() => field?.focus())
    }
  }, [open])

  const activeParent =
    parentGroup || groups.find((g) => g.id === selectedGroupId) || null

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      patchPendingChanges({ error: 'Subcategory name is required.' })
      return
    }
    if (!activeParent) {
      patchPendingChanges({ error: 'Please select a parent category.' })
      return
    }
    run(async () => {
      const result = await Promise.resolve(onSubmit?.(activeParent.id, trimmed, subcategory))
      if (result === null || result === false) {
        patchPendingChanges({ error: 'A subcategory with this name already exists in this category.' })
        return
      }
      setPendingChanges(INITIAL)
    })
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity duration-300 ease-out cursor-pointer opacity-100"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-white border-l border-slate-200/80 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out translate-x-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subcategory-slider-title"
      >
        <SliderPanelHeader
          titleId="subcategory-slider-title"
          title={isEditing ? 'Edit subcategory' : 'Add subcategory'}
          subtitle={
            activeParent
              ? `Under ${activeParent.name}`
              : 'Choose a parent category'
          }
          icon={HiOutlineCollection}
          onClose={onCancel}
          borderClass="border-teal-200/80"
          gradientClass="from-teal-600 via-emerald-600 to-cyan-600"
          subtitleClass="text-teal-50/90"
        />

        <div className="flex-1 min-h-0 overflow-auto p-5 sm:p-6">
          <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {needsParentPick ? (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Parent category
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => patchPendingChanges({ selectedGroupId: e.target.value, error: '' })}
                  className="field-select"
                  required
                >
                  <option value="">Select category</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            ) : null}
            <Input
              label="Subcategory name"
              value={name}
              onChange={(e) => patchPendingChanges({ name: e.target.value, error: '' })}
              placeholder="e.g. Milk products, Breads"
              required
            />
            {error ? (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
            ) : null}
          </form>
        </div>

        <div className="shrink-0 p-4 sm:p-5 border-t border-slate-200 bg-white shadow-[0_-4px_24px_rgba(15,23,42,0.06)]">
          <FormActions
            onCancel={onCancel}
            primaryLabel={isEditing ? 'Save changes' : 'Add subcategory'}
            primaryForm={FORM_ID}
            loading={loading}
            disabled={loading}
          />
        </div>
      </div>
    </>
  )
}
