import { useMemo } from 'react'
import { HiOutlineSupport, HiOutlinePlusCircle, HiOutlineTicket } from 'react-icons/hi'
import Button from '../components/common/Button'
import { useAuth } from '../context/AuthContext'
import { isAdminRole } from '../utils/roles'
import { useToast } from '../context/ToastContext'
import { useSupport } from './SupportContext'
import RaiseTicketModal from './RaiseTicketModal'
import TicketList from './TicketList'
import { FILTER_TABS } from './constants'
import { usePendingChanges } from '../hooks/usePendingChanges'

const INITIAL = { showRaise: false, filter: 'all' }

export default function SupportPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { tickets, addTicket, updateTicketStatus } = useSupport()
  const { pendingChanges, patchPendingChanges } = usePendingChanges(INITIAL)
  const { showRaise, filter } = pendingChanges

  const canManageStatus = isAdminRole(user?.role) || user?.role === 'manager'

  const counts = useMemo(() => ({
    all: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    'in-progress': tickets.filter((t) => t.status === 'in-progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  }), [tickets])

  const handleRaise = (data) => {
    const ticket = addTicket({
      ...data,
      raisedBy: { name: user?.name || 'User', role: user?.role || 'user' },
    })
    showToast(`Ticket ${ticket.ticketNo} submitted`)
    patchPendingChanges({ filter: 'all' })
  }

  const handleStatusChange = (id, status) => {
    updateTicketStatus(id, status)
    showToast('Ticket status updated', 'info')
  }

  return (
    <div className="support-shell h-full min-h-full flex flex-col">
      <div className="flex-1 flex flex-col gap-5 sm:gap-6 p-4 sm:p-6 lg:p-8 w-full min-h-0">
        <header className="flex flex-wrap items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-4 min-w-0">
            <div className="shrink-0 w-12 h-12 rounded-md bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
              <HiOutlineSupport className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Support center</h1>
              <p className="text-slate-600 text-sm mt-1">Raise tickets and track responses in one place.</p>
            </div>
          </div>
          <Button onClick={() => patchPendingChanges({ showRaise: true })} className="flex items-center gap-2">
            <HiOutlinePlusCircle className="w-5 h-5" />
            Raise ticket
          </Button>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
          {[
            { label: 'Total', value: counts.all, icon: HiOutlineTicket, tone: 'from-slate-600 to-slate-700' },
            { label: 'Open', value: counts.open, icon: HiOutlineTicket, tone: 'from-sky-500 to-blue-600' },
            { label: 'In progress', value: counts['in-progress'], icon: HiOutlineTicket, tone: 'from-amber-500 to-orange-500' },
            { label: 'Resolved', value: counts.resolved, icon: HiOutlineTicket, tone: 'from-emerald-500 to-teal-600' },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="bg-white rounded-md border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">{value}</p>
                </div>
                <div className={`w-9 h-9 rounded-md bg-gradient-to-br ${tone} flex items-center justify-center text-white shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col min-h-0 bg-white/80 backdrop-blur-sm rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <div className="shrink-0 flex flex-wrap gap-2 p-4 sm:p-5 border-b border-slate-100">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => patchPendingChanges({ filter: tab.value })}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  filter === tab.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
                <span className="ml-1.5 opacity-80">({counts[tab.value] ?? 0})</span>
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-5">
            <TicketList
              tickets={tickets}
              filter={filter}
              canManageStatus={canManageStatus}
              onStatusChange={handleStatusChange}
            />
          </div>
        </div>
      </div>

      <RaiseTicketModal
        open={showRaise}
        onSubmit={handleRaise}
        onClose={() => patchPendingChanges({ showRaise: false })}
      />
    </div>
  )
}
