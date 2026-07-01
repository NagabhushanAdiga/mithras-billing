import { HiOutlineX } from 'react-icons/hi'

const closeBtnClass =
  'flex items-center justify-center w-9 h-9 shrink-0 rounded-md bg-white/15 border border-white/25 text-white hover:bg-white/25 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50'

export default function SliderPanelHeader({
  title,
  titleId,
  subtitle,
  icon: Icon,
  onClose,
  closeRef,
  closeLabel = 'Close',
  borderClass = 'border-white/20',
  gradientClass = 'from-violet-600 via-purple-600 to-fuchsia-600',
  subtitleClass = 'text-white/85',
}) {
  return (
    <div
      className={`relative shrink-0 border-b ${borderClass} bg-gradient-to-r ${gradientClass} text-white overflow-visible`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_55%)] pointer-events-none" />
      <div className="relative p-5 sm:p-6 flex items-start gap-4">
        <div className="shrink-0 w-11 h-11 rounded-md bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
          <Icon className="w-6 h-6 text-white" aria-hidden />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <h2 id={titleId} className="text-lg font-bold text-white leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className={`${subtitleClass} text-sm mt-1 leading-snug`}>{subtitle}</p>
          )}
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className={closeBtnClass}
          aria-label={closeLabel}
        >
          <HiOutlineX className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
