import {
  HiOutlineViewGrid,
  HiOutlineShoppingCart,
  HiOutlineReceiptRefund,
  HiOutlineCube,
  HiOutlineCollection,
  HiOutlineTag,
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineQrcode,
  HiOutlineSupport,
  HiOutlineUserGroup,
  HiOutlineClipboardCheck,
} from 'react-icons/hi'

export const navItems = [
  {
    path: '/',
    label: 'Dashboard',
    description: 'Store overview and quick links',
    Icon: HiOutlineViewGrid,
    roles: ['admin', 'cashier', 'manager'],
    active: 'from-emerald-500 to-teal-500 shadow-emerald-500/40',
    cardBg: 'from-emerald-100 via-teal-50 to-cyan-100',
    cardBorder: 'border-emerald-300/80',
    cardShadow: 'group-hover:shadow-emerald-300/50',
    labelColor: 'text-emerald-900',
  },
  {
    path: '/pos',
    label: 'POS / Billing',
    description: 'Scan products and generate bills',
    Icon: HiOutlineShoppingCart,
    roles: ['admin', 'cashier', 'manager'],
    active: 'from-blue-500 to-cyan-500 shadow-blue-500/40',
    cardBg: 'from-sky-100 via-blue-50 to-cyan-100',
    cardBorder: 'border-sky-300/80',
    cardShadow: 'group-hover:shadow-sky-300/50',
    labelColor: 'text-sky-900',
  },
  {
    path: '/recent-bills',
    label: 'Recently billed',
    description: 'View and reprint your bills',
    Icon: HiOutlineReceiptRefund,
    roles: ['admin', 'cashier', 'manager'],
    active: 'from-cyan-500 to-indigo-500 shadow-cyan-500/40',
    cardBg: 'from-cyan-100 via-indigo-50 to-blue-100',
    cardBorder: 'border-cyan-300/80',
    cardShadow: 'group-hover:shadow-cyan-300/50',
    labelColor: 'text-cyan-900',
  },
  {
    path: '/products',
    label: 'Products',
    description: 'Manage inventory and barcodes',
    Icon: HiOutlineCube,
    roles: ['admin', 'manager'],
    active: 'from-orange-500 to-amber-500 shadow-orange-500/40',
    cardBg: 'from-orange-100 via-amber-50 to-yellow-100',
    cardBorder: 'border-orange-300/80',
    cardShadow: 'group-hover:shadow-orange-300/50',
    labelColor: 'text-orange-900',
  },
  {
    path: '/categories',
    label: 'Categories',
    description: 'Organize products by category',
    Icon: HiOutlineCollection,
    roles: ['admin', 'manager'],
    active: 'from-violet-500 to-purple-500 shadow-violet-500/40',
    cardBg: 'from-violet-100 via-purple-50 to-fuchsia-100',
    cardBorder: 'border-violet-300/80',
    cardShadow: 'group-hover:shadow-violet-300/50',
    labelColor: 'text-violet-900',
  },
  {
    path: '/subcategories',
    label: 'Subcategories',
    description: 'Milk, breads, and other groups under categories',
    Icon: HiOutlineTag,
    roles: ['admin', 'manager'],
    active: 'from-teal-500 to-emerald-500 shadow-teal-500/40',
    cardBg: 'from-teal-100 via-emerald-50 to-cyan-100',
    cardBorder: 'border-teal-300/80',
    cardShadow: 'group-hover:shadow-teal-300/50',
    labelColor: 'text-teal-900',
  },
  {
    path: '/barcodes',
    label: 'Barcodes',
    description: 'Print and download barcode labels',
    Icon: HiOutlineQrcode,
    roles: ['admin', 'manager'],
    active: 'from-fuchsia-500 to-pink-500 shadow-fuchsia-500/40',
    cardBg: 'from-fuchsia-100 via-pink-50 to-rose-100',
    cardBorder: 'border-fuchsia-300/80',
    cardShadow: 'group-hover:shadow-fuchsia-300/50',
    labelColor: 'text-fuchsia-900',
  },
  {
    path: '/reports',
    label: 'Reports',
    description: 'Sales analytics and Excel export',
    Icon: HiOutlineChartBar,
    roles: ['admin', 'manager'],
    active: 'from-pink-500 to-rose-500 shadow-pink-500/40',
    cardBg: 'from-pink-100 via-rose-50 to-red-100',
    cardBorder: 'border-pink-300/80',
    cardShadow: 'group-hover:shadow-pink-300/50',
    labelColor: 'text-pink-900',
  },
  {
    path: '/team',
    label: 'Team',
    description: 'Add admins, cashiers, and managers',
    Icon: HiOutlineUserGroup,
    roles: ['admin'],
    active: 'from-indigo-500 to-violet-500 shadow-indigo-500/40',
    cardBg: 'from-indigo-100 via-violet-50 to-purple-100',
    cardBorder: 'border-indigo-300/80',
    cardShadow: 'group-hover:shadow-indigo-300/50',
    labelColor: 'text-indigo-900',
  },
  {
    path: '/settings',
    label: 'Settings',
    description: 'Store profile, tax, and discounts',
    Icon: HiOutlineCog,
    roles: ['admin'],
    active: 'from-slate-600 to-zinc-700 shadow-slate-500/40',
    cardBg: 'from-slate-200 via-zinc-100 to-violet-100',
    cardBorder: 'border-slate-400/70',
    cardShadow: 'group-hover:shadow-slate-400/40',
    labelColor: 'text-slate-900',
  },
  {
    path: '/audit',
    label: 'Audit log',
    description: 'Review sign-ins, bills, and store changes',
    Icon: HiOutlineClipboardCheck,
    roles: ['admin'],
    active: 'from-zinc-600 to-slate-700 shadow-zinc-500/40',
    cardBg: 'from-zinc-200 via-slate-100 to-gray-100',
    cardBorder: 'border-zinc-400/70',
    cardShadow: 'group-hover:shadow-zinc-400/40',
    labelColor: 'text-zinc-900',
  },
  {
    path: '/support',
    label: 'Support',
    description: 'Raise and track support tickets',
    Icon: HiOutlineSupport,
    roles: ['admin', 'cashier', 'manager'],
    sidebarBottom: true,
    active: 'from-sky-500 to-blue-600 shadow-sky-500/40',
    cardBg: 'from-blue-100 via-sky-50 to-indigo-100',
    cardBorder: 'border-blue-300/80',
    cardShadow: 'group-hover:shadow-blue-300/50',
    labelColor: 'text-blue-900',
  },
]

export function getNavItemsForRole(role) {
  return navItems.filter((item) => roleHasAccess(item.roles, role))
}

export function normalizePath(path) {
  if (path === '/groups') return '/categories'
  return path || '/'
}

function roleHasAccess(itemRoles, userRole) {
  if (!userRole) return false
  return itemRoles.includes(userRole)
}

export function canAccessPath(path, role) {
  if (!role) return false
  const normalized = normalizePath(path)
  if (normalized === '/') return true
  const item = navItems.find((n) => n.path === normalized)
  if (!item) return false
  return roleHasAccess(item.roles, role)
}
