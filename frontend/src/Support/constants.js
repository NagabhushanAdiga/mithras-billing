export const TICKET_CATEGORIES = [
  { value: 'billing', label: 'Billing & invoices' },
  { value: 'pos', label: 'POS / checkout' },
  { value: 'products', label: 'Products & inventory' },
  { value: 'account', label: 'Account & access' },
  { value: 'other', label: 'Other' },
]

export const TICKET_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export const TICKET_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
]

export const STATUS_STYLES = {
  open: 'bg-sky-100 text-sky-800 border-sky-200',
  'in-progress': 'bg-amber-100 text-amber-800 border-amber-200',
  resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

export const PRIORITY_STYLES = {
  low: 'border-l-slate-300',
  medium: 'border-l-amber-400',
  high: 'border-l-rose-500',
}

export const FILTER_TABS = [
  { value: 'all', label: 'All tickets' },
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
]
