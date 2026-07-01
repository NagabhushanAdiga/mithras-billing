import { HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineUser } from 'react-icons/hi'
import { usePendingChanges } from '../hooks/usePendingChanges'
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  STATUS_STYLES,
  PRIORITY_STYLES,
} from './constants'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString() + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function labelFor(options, value) {
  return options.find((o) => o.value === value)?.label || value
}

export default function TicketCard({ ticket, canManageStatus, onStatusChange }) {
  const { pendingChanges, patchPendingChanges } = usePendingChanges({ open: false })
  const { open } = pendingChanges

  return (
    <article
      className={`bg-white rounded-md border border-slate-200 border-l-4 ${PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES.low} shadow-sm overflow-hidden`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-slate-500">{ticket.ticketNo}</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${STATUS_STYLES[ticket.status] || STATUS_STYLES.open}`}>
                {labelFor(TICKET_STATUSES, ticket.status)}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                {labelFor(TICKET_PRIORITIES, ticket.priority)}
              </span>
            </div>
            <h3 className="text-slate-900 font-bold text-base leading-snug">{ticket.subject}</h3>
            <p className="text-slate-500 text-xs mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>{labelFor(TICKET_CATEGORIES, ticket.category)}</span>
              <span>{formatDate(ticket.createdAt)}</span>
              {ticket.raisedBy?.name && (
                <span className="inline-flex items-center gap-1">
                  <HiOutlineUser className="w-3.5 h-3.5" />
                  {ticket.raisedBy.name}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canManageStatus && ticket.status !== 'resolved' && (
              <select
                value={ticket.status}
                onChange={(e) => onStatusChange?.(ticket.id, e.target.value)}
                className="field-select !py-1.5 !text-xs !w-auto min-w-[120px]"
              >
                {TICKET_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => patchPendingChanges({ open: !open })}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              {open ? <HiOutlineChevronUp className="w-4 h-4" /> : <HiOutlineChevronDown className="w-4 h-4" />}
              {open ? 'Hide' : 'View'}
            </button>
          </div>
        </div>

        {open && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</p>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>
        )}
      </div>
    </article>
  )
}
