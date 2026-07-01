import { createPortal } from 'react-dom'
import Button from './Button'
import Card from './Card'

export default function ConfirmDialog({
  open,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  confirmLoading = false,
  onConfirm,
  onCancel,
}) {
  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onCancel}
    >
      <div className="max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <Card className="p-6 shadow-2xl">
        <h3 id="confirm-dialog-title" className="text-lg font-bold text-slate-900 mb-2">
          {title}
        </h3>
        {message && <p className="text-slate-500 text-sm mb-5 leading-relaxed">{message}</p>}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={confirmLoading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={confirmLoading}>
            {confirmLabel}
          </Button>
        </div>
        </Card>
      </div>
    </div>,
    document.body
  )
}
