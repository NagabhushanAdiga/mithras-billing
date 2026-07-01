import { useEffect, useRef } from 'react'
import { HiOutlineSupport } from 'react-icons/hi'
import Input from '../components/common/Input'
import FormActions from '../components/common/FormActions'
import SliderPanelHeader from '../components/common/SliderPanelHeader'
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from './constants'
import { useAsyncAction, delay } from '../hooks/useAsyncAction'
import { usePendingChanges } from '../hooks/usePendingChanges'

const FORM_ID = 'raise-ticket-form'
const INITIAL = { subject: '', description: '', category: 'billing', priority: 'medium', errors: {} }

export default function RaiseTicketModal({ open, onSubmit, onClose }) {
  const panelRef = useRef(null)
  const { pendingChanges, setPendingChanges, patchPendingChanges } = usePendingChanges(INITIAL)
  const { subject, description, category, priority, errors } = pendingChanges
  const { loading, run } = useAsyncAction()

  useEffect(() => {
    if (!open) return
    setPendingChanges(INITIAL)
  }, [open, setPendingChanges])

  useEffect(() => {
    if (!open) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  useEffect(() => {
    if (open && panelRef.current) {
      const field = panelRef.current.querySelector('form input')
      requestAnimationFrame(() => field?.focus())
    }
  }, [open])

  const handleSubmit = (e) => {
    e.preventDefault()
    const nextErrors = {}
    if (!subject.trim()) nextErrors.subject = 'Subject is required'
    if (!description.trim()) nextErrors.description = 'Please describe the issue'
    if (Object.keys(nextErrors).length > 0) {
      patchPendingChanges({ errors: nextErrors })
      return
    }
    run(async () => {
      await delay(350)
      onSubmit?.({
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
      })
      onClose?.()
    })
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-40 transition-opacity duration-300 cursor-pointer ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-full sm:max-w-lg bg-slate-50 border-l border-slate-200 shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="raise-ticket-title"
      >
        <SliderPanelHeader
          titleId="raise-ticket-title"
          title="Raise a ticket"
          subtitle="We'll track your request here"
          icon={HiOutlineSupport}
          onClose={onClose}
          borderClass="border-sky-200/80"
          gradientClass="from-sky-500 via-indigo-500 to-blue-600"
          subtitleClass="text-sky-50/90"
        />

        <div className="flex-1 min-h-0 overflow-auto p-5 sm:p-6">
          <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <Input
              label="Subject"
              value={subject}
              onChange={(e) => patchPendingChanges({ subject: e.target.value, errors: { ...errors, subject: '' } })}
              placeholder="Brief summary of the issue"
              error={errors.subject}
              required
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => patchPendingChanges({ category: e.target.value })}
                className="field-select"
              >
                {TICKET_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => patchPendingChanges({ priority: e.target.value })}
                className="field-select"
              >
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => patchPendingChanges({ description: e.target.value, errors: { ...errors, description: '' } })}
                placeholder="What happened? Include steps to reproduce if possible."
                rows={5}
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                className={`field-input resize-y min-h-[120px] ${errors.description ? 'field-input-error' : ''}`}
                required
              />
              {errors.description && <p className="mt-1.5 text-sm text-red-600">{errors.description}</p>}
            </div>
          </form>
        </div>

        <div className="shrink-0 p-4 sm:p-5 border-t border-slate-200 bg-white">
          <FormActions
            onCancel={onClose}
            primaryLabel="Submit ticket"
            primaryForm={FORM_ID}
            loading={loading}
            disabled={loading}
          />
        </div>
      </div>
    </>
  )
}
