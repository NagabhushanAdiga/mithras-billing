import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi'
import Button from './Button'

export default function Pagination({
  page,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  className = '',
}) {
  if (totalItems === 0) return null

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-100 mt-4 ${className}`}
    >
      <p className="text-sm text-slate-500">
        Showing{' '}
        <span className="font-semibold text-slate-700 tabular-nums">{startIndex}</span>
        {' – '}
        <span className="font-semibold text-slate-700 tabular-nums">{endIndex}</span>
        {' of '}
        <span className="font-semibold text-slate-700 tabular-nums">{totalItems}</span>
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="!px-3 !py-2"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <HiOutlineChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <span className="text-sm font-semibold text-slate-700 px-2 tabular-nums whitespace-nowrap">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            className="!px-3 !py-2"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
            <HiOutlineChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
