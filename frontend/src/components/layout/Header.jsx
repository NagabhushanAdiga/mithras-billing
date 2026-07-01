import { HiOutlineLogout, HiOutlineMenu } from 'react-icons/hi'
import { IoStorefrontOutline } from 'react-icons/io5'
import { useAuth } from '../../context/AuthContext'
import { useStore } from '../../context/StoreContext'
import { roleLabel } from '../../utils/roles'
import Button from '../common/Button'
import InitialAvatar from '../common/InitialAvatar'
import ConfirmDialog from '../common/ConfirmDialog'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { usePendingChanges } from '../../hooks/usePendingChanges'

const INITIAL = { showLogoutConfirm: false }

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { settings } = useStore()
  const { pendingChanges, patchPendingChanges } = usePendingChanges(INITIAL)
  const { showLogoutConfirm } = pendingChanges
  const { loading: loggingOut, run: runLogout } = useAsyncAction()

  const handleLogoutClick = () => patchPendingChanges({ showLogoutConfirm: true })
  const handleLogoutConfirm = () => {
    runLogout(async () => {
      logout()
      patchPendingChanges({ showLogoutConfirm: false })
    })
  }

  return (
    <>
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200 shrink-0 z-20 relative">
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 via-sky-500 via-50% to-fuchsia-500" />
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-1 rounded-md text-violet-700 hover:bg-violet-100 transition-colors"
            aria-label="Open menu"
          >
            <HiOutlineMenu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex items-center justify-center w-10 h-10 rounded-md bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/30 shrink-0">
              <IoStorefrontOutline className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <span className="block text-base sm:text-lg font-bold bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent truncate leading-tight">
                {settings?.storeName || 'SuperMart Billing'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <InitialAvatar name={user?.name} size="sm" />
            <div className="min-w-0">
              <span className="block text-sm font-semibold text-slate-800 truncate max-w-[100px] sm:max-w-[120px] md:max-w-[200px] leading-tight">
                {user?.name}
              </span>
              <span className="block text-xs font-medium text-slate-500 truncate max-w-[100px] sm:max-w-[120px] md:max-w-[200px] leading-tight mt-0.5">
                {roleLabel(user?.role)}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogoutClick}
            className="!text-red-600 !border-red-200 hover:!bg-red-50 hover:!border-red-300 hover:!text-red-700"
          >
            <HiOutlineLogout className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>
      <ConfirmDialog
        open={showLogoutConfirm}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmLabel="Logout"
        variant="danger"
        confirmLoading={loggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={() => patchPendingChanges({ showLogoutConfirm: false })}
      />
    </>
  )
}
