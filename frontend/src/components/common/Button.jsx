export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  className = '',
  loading = false,
  disabled,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-semibold text-sm cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed focus:ring-offset-blue-50 active:scale-[0.98] shadow-none'
  const variants = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400',
    secondary:
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400',
    ghost:
      'bg-transparent text-blue-700 hover:bg-blue-50 hover:text-blue-900 focus:ring-blue-300',
    outline:
      'bg-white text-blue-800 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 focus:ring-blue-300',
  }
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {loading && (
        <span
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin-slow shrink-0"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}
