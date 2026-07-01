import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { label, hint, error, className = '', inputClassName = '', icon: Icon, ...props },
  ref
) {
  const fieldClasses = [
    'field-input',
    Icon ? 'field-input-with-icon' : '',
    error ? 'field-input-error' : '',
    inputClassName,
  ]
    .filter(Boolean)
    .join(' ')

  const control = Icon ? (
    <div className="field-input-wrap">
      <span className="field-input-icon" aria-hidden="true">
        <Icon />
      </span>
      <input
        ref={ref}
        className={fieldClasses}
        {...props}
        autoComplete="off"
        data-lpignore="true"
        data-1p-ignore="true"
      />
    </div>
  ) : (
    <input
      ref={ref}
      className={fieldClasses}
      {...props}
      autoComplete="off"
      data-lpignore="true"
      data-1p-ignore="true"
    />
  )

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      {hint && !error && <p className="text-xs text-slate-400 mb-1.5 -mt-1">{hint}</p>}
      {control}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  )
})

export default Input

