export default function Card({ children, className = '', hover = false, showAccent = true }) {
  return (
    <div
      className={`relative bg-white rounded-md border border-slate-200/80 shadow-sm overflow-hidden ${
        hover ? 'hover:shadow-lg hover:border-violet-200/80 transition-all duration-200' : ''
      } ${className}`}
    >
      {showAccent && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-sky-500 via-40% to-fuchsia-500" />
      )}
      {children}
    </div>
  )
}
