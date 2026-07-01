import { useEffect, useRef } from 'react'
import { HiOutlineUser, HiOutlinePhone } from 'react-icons/hi'
import Button from '../common/Button'
import Card from '../common/Card'
import Input from '../common/Input'
import FormActions from '../common/FormActions'
import { sanitizeDigitsOnly, validateCustomerMobile } from '../../utils/billingValidation'
import { usePendingChanges } from '../../hooks/usePendingChanges'

const INITIAL = { customerName: '', customerMobile: '', errors: {} }

export default function InvoiceCustomerModal({ open, onConfirm, onCancel, totalFormatted, confirmLoading = false }) {
  const { pendingChanges, setPendingChanges, patchPendingChanges } = usePendingChanges(INITIAL)
  const { customerName, customerMobile, errors } = pendingChanges
  const mobileInputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onCancel])

  useEffect(() => {
    if (open && mobileInputRef.current) {
      const t = setTimeout(() => mobileInputRef.current?.focus(), 100)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setPendingChanges(INITIAL)
    }
  }, [open, setPendingChanges])

  const handleSubmit = (e) => {
    e.preventDefault()
    const mobileError = validateCustomerMobile(customerMobile)
    if (mobileError) {
      patchPendingChanges({ errors: { customerMobile: mobileError } })
      return
    }
    onConfirm({
      customerName: customerName.trim(),
      customerMobile: sanitizeDigitsOnly(customerMobile),
    })
    setPendingChanges(INITIAL)
  }

  const handleCancel = () => {
    setPendingChanges(INITIAL)
    onCancel()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="p-6 sm:p-8 max-w-md w-full shadow-2xl">
        <h3 className="text-xl font-bold text-slate-900 mb-1">Customer details</h3>
        <p className="text-slate-500 text-sm mb-4 leading-relaxed">
          Enter a 10-digit mobile (name optional). The bill will open for printing right away.
        </p>
        {totalFormatted && (
          <div className="rounded-md bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 px-4 py-3 mb-5">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Bill total</p>
            <p className="text-emerald-600 font-extrabold text-xl mt-0.5">{totalFormatted}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <Input
            ref={mobileInputRef}
            label="Mobile number"
            hint="Optional — 10 digits, starts with 6–9"
            type="tel"
            inputMode="numeric"
            icon={HiOutlinePhone}
            value={customerMobile}
            onChange={(e) => {
              patchPendingChanges({
                customerMobile: sanitizeDigitsOnly(e.target.value),
                errors: { ...errors, customerMobile: '' },
              })
            }}
            placeholder="e.g. 9876543210"
            maxLength={10}
            error={errors.customerMobile}
            autoFocus
          />
          <Input
            label="Customer name"
            hint="Optional"
            icon={HiOutlineUser}
            value={customerName}
            onChange={(e) => patchPendingChanges({ customerName: e.target.value })}
            placeholder="Enter customer name (optional)"
          />
          <FormActions
            className="pt-2"
            onCancel={handleCancel}
            primaryLabel={confirmLoading ? 'Generating…' : 'Print bill'}
            primaryType="submit"
            loading={confirmLoading}
            disabled={confirmLoading}
          />
        </form>
      </Card>
    </div>
  )
}
