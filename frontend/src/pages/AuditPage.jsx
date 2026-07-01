import { useMemo } from 'react'
import {
  HiOutlineClipboardList,
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlineDownload,
} from 'react-icons/hi'
import Card from '../components/common/Card'
import Input from '../components/common/Input'
import FilterSelect from '../components/common/FilterSelect'
import PageHeader from '../components/common/PageHeader'
import Pagination from '../components/common/Pagination'
import TableIdentityCell from '../components/common/TableIdentityCell'
import Button from '../components/common/Button'
import { useAudit } from '../context/AuditContext'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { usePagination } from '../hooks/usePagination'
import { usePendingChanges } from '../hooks/usePendingChanges'
import { USE_API } from '../api/client'
import { clear as clearAudit } from '../api/services/auditService'
import { exportAuditLogExcel } from '../utils/exportAuditLog'
import {
  AUDIT_CATEGORIES,
  formatAuditAction,
  formatAuditTime,
  logAudit,
} from '../utils/auditLog'

const INITIAL = { search: '', category: '', confirmClear: false, clearPassword: '', clearPasswordError: '' }

const CATEGORY_COLORS = {
  auth: 'bg-slate-100 text-slate-700 border-slate-200',
  billing: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  product: 'bg-orange-100 text-orange-800 border-orange-200',
  category: 'bg-violet-100 text-violet-800 border-violet-200',
  settings: 'bg-blue-100 text-blue-800 border-blue-200',
  team: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  report: 'bg-pink-100 text-pink-800 border-pink-200',
  system: 'bg-amber-100 text-amber-800 border-amber-200',
}

function actorLabel(actor) {
  if (!actor) return 'System'
  return actor.name || actor.username || 'Unknown'
}

function actorSubtitle(actor) {
  if (!actor) return 'Automated'
  const parts = []
  if (actor.username) parts.push(`@${actor.username}`)
  if (actor.role) parts.push(actor.role)
  return parts.join(' · ') || 'User'
}

function formatDateTime(iso) {
  const d = new Date(iso)
  return {
    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }),
  }
}

function AuditRow({ entry }) {
  const user = actorLabel(entry.actor)
  const { time, date } = formatDateTime(entry.at)

  return (
    <tr className="border-b border-slate-300 hover:bg-slate-50/80">
      <td className="py-3.5 px-2 min-w-[160px]">
        <TableIdentityCell
          title={user}
          subtitle={actorSubtitle(entry.actor)}
          name={user}
          avatarFallback={user === 'System' ? 'S' : undefined}
          subtitleClassName="text-slate-400 text-xs mt-0.5 truncate"
        />
      </td>
      <td className="py-3.5 px-2 min-w-[180px]">
        <p className="text-slate-900 font-semibold text-sm">{formatAuditAction(entry.action)}</p>
        <p className="text-slate-500 text-xs mt-1 line-clamp-2">{entry.details || '—'}</p>
        <div className="mt-2 sm:hidden">
          <span
            className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold border capitalize ${
              CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.system
            }`}
          >
            {entry.category}
          </span>
        </div>
      </td>
      <td className="py-3.5 px-2 hidden sm:table-cell whitespace-nowrap">
        <span
          className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold border capitalize ${
            CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.system
          }`}
        >
          {entry.category}
        </span>
      </td>
      <td className="py-3.5 px-2 text-left sm:text-right whitespace-nowrap">
        <p className="text-slate-900 font-bold text-sm tabular-nums">{time}</p>
        <p className="text-slate-400 text-xs mt-0.5 hidden sm:block">{date}</p>
        <p className="text-slate-400 text-xs mt-0.5 sm:hidden" title={formatAuditTime(entry.at)}>
          {date}
        </p>
      </td>
    </tr>
  )
}

export default function AuditPage() {
  const { entries, clearAuditLog } = useAudit()
  const { verifyPassword } = useAuth()
  const { settings } = useStore()
  const { showToast } = useToast()
  const { loading: exporting, run: runExport } = useAsyncAction()
  const { loading: clearing, run: runClear } = useAsyncAction()
  const { pendingChanges, patchPendingChanges } = usePendingChanges(INITIAL)
  const { search, category, confirmClear, clearPassword, clearPasswordError } = pendingChanges

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries.filter((entry) => {
      if (category && entry.category !== category) return false
      if (!q) return true
      const haystack = [
        entry.action,
        entry.category,
        entry.details,
        actorLabel(entry.actor),
        entry.actor?.username,
        entry.actor?.role,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [entries, search, category])

  const {
    paginatedItems,
    page,
    setPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filtered, { resetDeps: [search, category] })

  const categoryLabel =
    AUDIT_CATEGORIES.find((c) => c.value === category)?.label || 'All activity'

  const handleExport = () => {
    runExport(async () => {
      try {
        const filename = exportAuditLogExcel(
          filtered,
          { search, categoryLabel },
          { storeName: settings?.storeName || 'Store' }
        )
        logAudit('audit_exported', {
          category: 'system',
          details: `${filename} · ${filtered.length} entries`,
        })
        showToast(`Exported ${filename}`)
      } catch (err) {
        showToast(err.message || 'Could not export audit log', 'error')
      }
    })
  }

  const closeClearDialog = () => {
    patchPendingChanges({ confirmClear: false, clearPassword: '', clearPasswordError: '' })
  }

  const handleConfirmClear = () => {
    if (!clearPassword) {
      patchPendingChanges({ clearPasswordError: 'Enter your admin password to continue' })
      return
    }

    runClear(async () => {
      if (!(await verifyPassword(clearPassword))) {
        patchPendingChanges({ clearPasswordError: 'Incorrect password' })
        return
      }

      if (USE_API) {
        try {
          await clearAudit()
        } catch {
          showToast('Could not clear audit log', 'error')
          return
        }
      }

      logAudit('audit_cleared', {
        category: 'system',
        details: `${entries.length} entries removed`,
      })
      clearAuditLog()
      closeClearDialog()
      showToast('Audit log cleared', 'info')
    })
  }

  return (
    <div className="h-full max-h-full flex flex-col min-h-0 overflow-hidden">
      <PageHeader
        icon={HiOutlineClipboardList}
        iconClassName="from-slate-600 to-zinc-700 shadow-slate-500/25"
        title="Audit log"
        description="Track sign-ins, billing, product changes, settings updates, and team actions."
      />

      <Card className="p-3 sm:p-4 flex-1 flex flex-col min-h-0 gap-3 overflow-hidden">
        {entries.length === 0 ? (
          <div className="flex-1 flex items-center justify-center rounded-md border border-dashed border-violet-200 py-16 px-4 text-center bg-violet-50/30">
            <div>
              <div className="inline-flex w-14 h-14 rounded-md bg-violet-50 items-center justify-center mb-3">
                <HiOutlineClipboardList className="w-7 h-7 text-violet-500" />
              </div>
              <p className="text-slate-500 text-sm font-medium">No activity recorded yet.</p>
              <p className="text-slate-400 text-xs mt-1">
                Actions across the app will appear here automatically.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="shrink-0 space-y-2">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 min-w-0 items-end">
                  <Input
                    label="Search"
                    type="search"
                    icon={HiOutlineSearch}
                    placeholder="Action, user, or details..."
                    value={search}
                    onChange={(e) => patchPendingChanges({ search: e.target.value })}
                  />
                  <FilterSelect
                    label="Category"
                    id="audit-category-filter"
                    value={category}
                    onChange={(e) => patchPendingChanges({ category: e.target.value })}
                  >
                    {AUDIT_CATEGORIES.map((c) => (
                      <option key={c.value || 'all'} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </FilterSelect>
                </div>
                <div className="shrink-0 w-full lg:w-auto">
                  <label
                    className="hidden lg:block text-sm font-semibold text-slate-700 mb-1.5 invisible select-none"
                    aria-hidden="true"
                  >
                    Actions
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      onClick={handleExport}
                      loading={exporting}
                      disabled={filtered.length === 0}
                      className="flex items-center gap-2 !h-[42px] !py-0 flex-1 sm:flex-none"
                    >
                      <HiOutlineDownload className="w-4 h-4" />
                      Export Excel
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => patchPendingChanges({ confirmClear: true })}
                      className="flex items-center gap-2 !h-[42px] !py-0 flex-1 sm:flex-none"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                      Clear log
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                {filtered.length} of {entries.length} entries
              </p>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              {filtered.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-slate-500 text-sm text-center py-12 border border-dashed border-slate-200 rounded-md px-6">
                    No entries match your filters.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-h-0 overflow-auto -mx-1 px-1">
                    <table className="w-full text-left min-w-[640px]">
                      <thead className="hidden sm:table-header-group">
                        <tr className="border-b border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-500">
                          <th className="pb-2 px-2 font-bold">User</th>
                          <th className="pb-2 px-2 font-bold">Activity</th>
                          <th className="pb-2 px-2 font-bold hidden sm:table-cell">Category</th>
                          <th className="pb-2 px-2 font-bold text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedItems.map((entry) => (
                          <AuditRow key={entry.id} entry={entry} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    onPageChange={setPage}
                    className="shrink-0 !mt-3 bg-white"
                  />
                </>
              )}
            </div>
          </>
        )}
      </Card>

      {confirmClear && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-audit-title"
        >
          <Card className="p-6 max-w-md w-full shadow-2xl border-2 border-red-200">
            <h3 id="clear-audit-title" className="text-lg font-bold text-red-900 mb-2">
              Clear audit log?
            </h3>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              This permanently removes all audit entries. This cannot be undone.
            </p>
            <Input
              label="Admin password"
              type="password"
              value={clearPassword}
              onChange={(e) =>
                patchPendingChanges({ clearPassword: e.target.value, clearPasswordError: '' })
              }
              error={clearPasswordError}
              placeholder="Enter your password to confirm"
            />
            <div className="flex gap-2 justify-end mt-5">
              <Button variant="outline" onClick={closeClearDialog} disabled={clearing}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleConfirmClear} loading={clearing}>
                Clear log
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
