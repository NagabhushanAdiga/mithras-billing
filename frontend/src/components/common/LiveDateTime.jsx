import { useEffect } from 'react'
import { HiOutlineClock } from 'react-icons/hi'
import { usePendingChanges } from '../../hooks/usePendingChanges'

export default function LiveDateTime({ className = '' }) {
  const { pendingChanges, patchPendingChanges } = usePendingChanges({ now: new Date() })
  const { now } = pendingChanges

  useEffect(() => {
    const id = setInterval(() => patchPendingChanges({ now: new Date() }), 1000)
    return () => clearInterval(id)
  }, [patchPendingChanges])

  const time = now
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
    .toLowerCase()

  const date = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-3.5 sm:px-5 sm:py-4 shrink-0 ${className}`}
      aria-live="polite"
      aria-label={`Current time ${time}, ${date}`}
    >
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-blue-500/15 blur-2xl pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600"
        aria-hidden
      />

      <div className="relative flex items-center gap-3 sm:gap-4">
        <div className="hidden sm:flex w-11 h-11 rounded-full bg-blue-600 items-center justify-center text-white shrink-0 ring-4 ring-blue-100">
          <HiOutlineClock className="w-5 h-5" />
        </div>

        <div className="min-w-0 flex-1 text-right">
          <div className="flex items-center justify-end gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700"
              aria-hidden
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-2xl sm:text-[1.75rem] font-extrabold text-slate-900 tabular-nums tracking-tight leading-none mt-1.5">
            {time}
          </p>
          <p className="text-slate-600 text-xs sm:text-sm font-medium mt-2 leading-snug">{date}</p>
        </div>
      </div>
    </div>
  )
}
