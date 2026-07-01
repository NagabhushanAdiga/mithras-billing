export default function PageHeader({ icon: Icon, iconClassName = 'from-emerald-500 to-teal-600 shadow-emerald-600/25', title, description, children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-4 min-w-0">
        {Icon && (
          <div
            className={`shrink-0 w-12 h-12 rounded-md bg-gradient-to-br ${iconClassName} flex items-center justify-center text-white shadow-lg`}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-violet-700 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent tracking-tight">{title}</h1>
          {description && <p className="text-slate-600 text-sm mt-1 leading-relaxed">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}
