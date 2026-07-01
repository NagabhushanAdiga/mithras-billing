export default function FilterSelect({
  label,
  id,
  value,
  onChange,
  children,
  className = '',
  'aria-label': ariaLabel,
}) {
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      ) : null}
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="field-select w-full"
        aria-label={ariaLabel || label}
      >
        {children}
      </select>
    </div>
  )
}
