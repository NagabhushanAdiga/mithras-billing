import { useMemo, useEffect } from 'react'
import { HiOutlineCurrencyDollar, HiOutlineShoppingBag, HiOutlineArchive, HiOutlineCube } from 'react-icons/hi'
import Card from '../components/common/Card'
import LiveDateTime from '../components/common/LiveDateTime'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { getNavItemsForRole } from '../config/navItems'
import { getTimeGreeting } from '../utils/greeting'
import { usePendingChanges } from '../hooks/usePendingChanges'

const statCards = [
  {
    key: 'todaySales',
    label: "Today's sales",
    Icon: HiOutlineCurrencyDollar,
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'from-emerald-100 via-emerald-50 to-teal-100',
    border: 'border-emerald-300/80',
    shadow: 'hover:shadow-emerald-300/50',
    labelColor: 'text-emerald-800',
    valueColor: 'text-emerald-950',
  },
  {
    key: 'todayOrders',
    label: 'Orders today',
    Icon: HiOutlineShoppingBag,
    gradient: 'from-sky-500 to-blue-600',
    bg: 'from-sky-100 via-blue-50 to-indigo-100',
    border: 'border-sky-300/80',
    shadow: 'hover:shadow-sky-300/50',
    labelColor: 'text-sky-800',
    valueColor: 'text-sky-950',
  },
  {
    key: 'totalOrders',
    label: 'Total orders',
    Icon: HiOutlineArchive,
    gradient: 'from-violet-500 to-fuchsia-600',
    bg: 'from-violet-100 via-fuchsia-50 to-purple-100',
    border: 'border-violet-300/80',
    shadow: 'hover:shadow-violet-300/50',
    labelColor: 'text-violet-800',
    valueColor: 'text-violet-950',
  },
  {
    key: 'productCount',
    label: 'Products',
    Icon: HiOutlineCube,
    gradient: 'from-amber-500 to-orange-500',
    bg: 'from-amber-100 via-orange-50 to-yellow-100',
    border: 'border-amber-300/80',
    shadow: 'hover:shadow-amber-300/50',
    labelColor: 'text-amber-800',
    valueColor: 'text-amber-950',
  },
]

export default function DashboardPage({ onNavigate }) {
  const { user } = useAuth()
  const { orders, products, settings } = useStore()
  const currency = settings?.currency || '₹'
  const { pendingChanges, patchPendingChanges } = usePendingChanges({
    greeting: getTimeGreeting(),
  })
  const { greeting } = pendingChanges

  useEffect(() => {
    const updateGreeting = () => patchPendingChanges({ greeting: getTimeGreeting() })
    updateGreeting()
    const id = setInterval(updateGreeting, 60_000)
    return () => clearInterval(id)
  }, [patchPendingChanges])

  const displayName = user?.name || 'there'

  const quickLinks = useMemo(
    () => getNavItemsForRole(user?.role).filter((item) => item.path !== '/'),
    [user?.role]
  )

  const stats = useMemo(() => {
    const today = new Date().toDateString()
    let todaySales = 0
    let todayOrders = 0
    orders.forEach((o) => {
      if (new Date(o.date).toDateString() === today) {
        todaySales += o.total
        todayOrders += 1
      }
    })
    return { todaySales, todayOrders, totalOrders: orders.length, productCount: products.length }
  }, [orders, products])

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-violet-700 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
            {greeting}, {displayName}
          </h1>
          <p className="text-slate-600 text-sm mt-1 leading-relaxed">
            Here&apos;s a quick snapshot of your store today.
          </p>
        </div>
        <LiveDateTime />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ key, label, Icon, gradient, bg, border, shadow, labelColor, valueColor }) => (
          <Card
            key={key}
            hover
            showAccent={false}
            className={`p-5 overflow-hidden relative bg-gradient-to-br ${bg} border-2 ${border} shadow-md ${shadow} transition-all`}
          >
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradient}`} />
            <div
              className={`absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${gradient} opacity-25 blur-2xl pointer-events-none`}
              aria-hidden
            />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`${labelColor} text-xs font-bold uppercase tracking-wider`}>{label}</p>
                <p className={`text-2xl sm:text-3xl font-extrabold mt-2 ${valueColor} truncate tracking-tight`}>
                  {key === 'todaySales' ? `${currency}${stats.todaySales.toFixed(2)}` : stats[key]}
                </p>
              </div>
              <div className={`shrink-0 w-12 h-12 rounded-md bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg ring-2 ring-white/60`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {quickLinks.map(({ path, label, description, Icon, active, cardBg, cardBorder, labelColor }) => {
          const iconGradient = active
          return (
            <button
              key={path}
              type="button"
              onClick={() => onNavigate?.(path)}
              className="text-left group h-full cursor-pointer"
            >
              <Card
                hover
                showAccent={false}
                className={`p-6 sm:p-7 min-h-[132px] h-full flex bg-gradient-to-br ${cardBg} border-2 ${cardBorder} transition-all`}
              >
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${iconGradient}`} />
                <div
                  className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${iconGradient} opacity-20 blur-2xl pointer-events-none group-hover:opacity-35 transition-opacity`}
                  aria-hidden
                />
                <div className="relative flex items-center gap-4 w-full">
                  <div
                    className={`shrink-0 w-12 h-12 rounded-md bg-gradient-to-br ${iconGradient} flex items-center justify-center text-white ring-2 ring-white/70 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`${labelColor} font-bold text-base group-hover:brightness-110 transition-all`}>
                      {label}
                    </p>
                    <p className="text-slate-600 text-sm mt-1.5 leading-snug line-clamp-2">{description}</p>
                  </div>
                </div>
              </Card>
            </button>
          )
        })}
      </div>
    </div>
  )
}
