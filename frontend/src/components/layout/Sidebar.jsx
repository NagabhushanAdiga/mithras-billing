import { useAuth } from '../../context/AuthContext'
import { getNavItemsForRole } from '../../config/navItems'

const ICON_COLORS = ['text-emerald-400', 'text-sky-400', 'text-amber-400', 'text-violet-400', 'text-pink-400', 'text-slate-400']

function NavItemButton({ item, idx, isActive, onNavigate }) {
  const { Icon, label } = item
  return (
    <button
      onClick={() => onNavigate?.(item.path)}
      className={`w-full group flex items-center gap-3 px-4 py-3 rounded-md text-left text-sm font-semibold cursor-pointer transition-all duration-200 ${
        isActive
          ? 'bg-blue-600 text-white scale-[1.02]'
          : 'text-violet-200/80 hover:text-white hover:bg-white/10'
      }`}
    >
      <span
        className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition-colors ${
          isActive ? 'bg-white/25' : `bg-white/10 ${ICON_COLORS[idx % ICON_COLORS.length]}`
        }`}
      >
        <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-white' : ''}`} />
      </span>
      <span className="flex-1 truncate">{label}</span>
    </button>
  )
}

export default function Sidebar({ currentPath, onNavigate, open = false }) {
  const { user } = useAuth()
  const visible = getNavItemsForRole(user?.role)
  const mainItems = visible.filter((item) => !item.sidebarBottom)
  const bottomItems = visible.filter((item) => item.sidebarBottom)

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-40 h-full w-full lg:w-72 lg:shrink-0 flex flex-col py-5 overflow-hidden transform transition-transform duration-300 ease-out shadow-2xl lg:shadow-none bg-gradient-to-b from-indigo-950 via-violet-950 to-fuchsia-950 border-r border-white/10 ${
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="px-4 mb-4 hidden lg:block shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300/70">Menu</p>
      </div>
      <nav className="flex flex-col flex-1 min-h-0 px-3 w-full">
        <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 min-h-0">
          {mainItems.map((item, idx) => (
            <NavItemButton
              key={item.path}
              item={item}
              idx={idx}
              isActive={currentPath === item.path}
              onNavigate={onNavigate}
            />
          ))}
        </div>
        {bottomItems.length > 0 && (
          <div className="shrink-0 pt-3 mt-2 border-t border-white/10 flex flex-col gap-1.5">
            {bottomItems.map((item, idx) => (
              <NavItemButton
                key={item.path}
                item={item}
                idx={mainItems.length + idx}
                isActive={currentPath === item.path}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </nav>
    </aside>
  )
}
