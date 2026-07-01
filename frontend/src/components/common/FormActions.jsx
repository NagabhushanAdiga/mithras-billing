import Button from './Button'

const btnClass = 'flex-1 min-w-0'

export default function FormActions({
  cancelLabel = 'Cancel',
  onCancel,
  primaryLabel,
  primaryType = 'submit',
  primaryForm,
  onPrimary,
  primaryVariant = 'primary',
  loading = false,
  disabled = false,
  className = '',
}) {
  return (
    <div className={`flex flex-col-reverse gap-2 w-full sm:flex-row ${className}`}>
      <Button
        type="button"
        variant="outline"
        className={btnClass}
        onClick={onCancel}
        disabled={loading || disabled}
      >
        {cancelLabel}
      </Button>
      <Button
        type={primaryType}
        variant={primaryVariant}
        form={primaryForm}
        className={btnClass}
        loading={loading}
        disabled={disabled}
        onClick={onPrimary}
      >
        {primaryLabel}
      </Button>
    </div>
  )
}
