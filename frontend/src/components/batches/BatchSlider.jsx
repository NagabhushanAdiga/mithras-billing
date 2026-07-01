import { useEffect, useRef } from 'react'
import { HiOutlineArchive } from 'react-icons/hi'
import Input from '../common/Input'
import FormActions from '../common/FormActions'
import SliderPanelHeader from '../common/SliderPanelHeader'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { usePendingChanges } from '../../hooks/usePendingChanges'

const FORM_ID = 'add-batch-form'
const INITIAL = { name: '', error: '' }

export default function BatchSlider({ open, onSubmit, onCancel }) {
  const panelRef = useRef(null)
  const { pendingChanges, setPendingChanges, patchPendingChanges } = usePendingChanges(INITIAL)
  const { name, error } = pendingChanges
  const { loading, run } = useAsyncAction()

  useEffect(() => {
    if (open) {
      setPendingChanges(INITIAL)
    }
  }, [open, setPendingChanges])

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
      const field = panelRef.current.querySelector('form input')
      requestAnimationFrame(() => field?.focus())
    }
  }, [open])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      patchPendingChanges({ error: 'Batch name is required.' })
      return
    }
    run(async () => {
      const result = await Promise.resolve(onSubmit?.(trimmed))
      if (result === null) {
        patchPendingChanges({ error: 'A batch with this name already exists.' })
        return
      }
      setPendingChanges(INITIAL)
    })
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity duration-300 ease-out cursor-pointer ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-full sm:max-w-md bg-white border-l border-slate-200/80 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="batch-slider-title"
      >
        <SliderPanelHeader
          titleId="batch-slider-title"
          title="Add batch"
          subtitle="Name your product batch for inventory tracking"
          icon={HiOutlineArchive}
          onClose={onCancel}
          borderClass="border-teal-200/80"
          gradientClass="from-teal-500 via-cyan-500 to-teal-600"
          subtitleClass="text-teal-50/90"
        />

        <div className="flex-1 min-h-0 overflow-auto p-5 sm:p-6">
          <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <Input
              label="Batch name"
              value={name}
              onChange={(e) => patchPendingChanges({ name: e.target.value, error: '' })}
              placeholder="e.g. March 2024, Lot #12"
              required
            />
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
            )}
          </form>
        </div>

        <div className="shrink-0 p-4 sm:p-5 border-t border-slate-200 bg-white shadow-[0_-4px_24px_rgba(15,23,42,0.06)]">
          <FormActions
            onCancel={onCancel}
            primaryLabel="Add batch"
            primaryForm={FORM_ID}
            loading={loading}
            disabled={loading}
          />
        </div>
      </div>
    </>
  )
}
