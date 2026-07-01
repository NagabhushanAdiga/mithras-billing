import { useEffect } from 'react'
import { HiOutlineUserGroup, HiOutlineTrash, HiOutlinePlusCircle, HiOutlineKey, HiOutlineX } from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import PageHeader from '../components/common/PageHeader'
import FormActions from '../components/common/FormActions'
import TableIdentityCell from '../components/common/TableIdentityCell'
import Pagination from '../components/common/Pagination'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { useAuth } from '../context/AuthContext'
import { isAdminRole, roleLabel } from '../utils/roles'
import { useToast } from '../context/ToastContext'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { usePagination } from '../hooks/usePagination'
import { usePendingChanges } from '../hooks/usePendingChanges'

const ROLE_BADGE = {
  admin: 'bg-violet-100 text-violet-700 border-violet-200',
  cashier: 'bg-sky-100 text-sky-700 border-sky-200',
  manager: 'bg-amber-100 text-amber-700 border-amber-200',
}

const iconBtnClass =
  'flex items-center justify-center w-9 h-9 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

const RESET_PASSWORD_INITIAL = {
  newPassword: '',
  confirmPassword: '',
}

function ResetPasswordDialog({ member, open, onClose, onSubmit, loading }) {
  const { pendingChanges, setPendingChanges, patchPendingChanges } = usePendingChanges(RESET_PASSWORD_INITIAL)
  const { newPassword, confirmPassword } = pendingChanges

  useEffect(() => {
    if (!open) return
    setPendingChanges(RESET_PASSWORD_INITIAL)
  }, [open, member?.id, setPendingChanges])

  useEffect(() => {
    if (!open) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  if (!open || !member) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ newPassword, confirmPassword })
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-password-title"
      onClick={onClose}
    >
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <Card className="shadow-2xl" showAccent={false}>
          <div className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-slate-100">
            <div className="min-w-0">
              <h3 id="reset-password-title" className="text-lg font-bold text-slate-900">
                Reset password
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                Set a new password for <strong className="text-slate-700">{member.name}</strong>
              </p>
              <p className="text-slate-400 text-xs font-mono mt-0.5">@{member.username}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`${iconBtnClass} text-slate-500 hover:text-slate-800 hover:bg-slate-100 shrink-0`}
              aria-label="Close"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4" autoComplete="off">
            <Input
              label="New password"
              type="password"
              hint="At least 4 characters"
              value={newPassword}
              onChange={(e) => patchPendingChanges({ newPassword: e.target.value })}
              required
            />
            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => patchPendingChanges({ confirmPassword: e.target.value })}
              required
            />
            <FormActions
              onCancel={onClose}
              primaryLabel="Update password"
              primaryType="submit"
              loading={loading}
              disabled={loading}
            />
          </form>
        </Card>
      </div>
    </div>
  )
}

const INITIAL = {
  name: '',
  username: '',
  password: '',
  role: 'cashier',
  adminPassword: '',
  adminPasswordError: '',
  resetMember: null,
  deleteConfirm: null,
}

export default function TeamPage() {
  const { user, teamMembers, addUser, deleteUser, resetUserPassword, verifyPassword } = useAuth()
  const { showToast } = useToast()
  const { loading: adding, run: runAdd } = useAsyncAction()
  const { loading: deleting, run: runDelete } = useAsyncAction()
  const { loading: resetting, run: runReset } = useAsyncAction()
  const { pendingChanges, patchPendingChanges } = usePendingChanges(INITIAL)
  const {
    name,
    username,
    password,
    role,
    adminPassword,
    adminPasswordError,
    resetMember,
    deleteConfirm,
  } = pendingChanges

  const {
    paginatedItems: paginatedMembers,
    page,
    setPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(teamMembers)

  const canAddAdmin = isAdminRole(user?.role)

  const handleAdd = (e) => {
    e.preventDefault()
    runAdd(async () => {
      if (role === 'admin') {
        if (!adminPassword) {
          patchPendingChanges({ adminPasswordError: 'Enter your password to add an admin' })
          return
        }
        if (!(await verifyPassword(adminPassword))) {
          patchPendingChanges({ adminPasswordError: 'Incorrect password' })
          return
        }
      }
      const addedRole = role
      const result = await addUser({
        name,
        username,
        password,
        role: addedRole,
        adminPassword: addedRole === 'admin' ? adminPassword : undefined,
      })
      if (!result.ok) {
        showToast(result.error, 'error')
        return
      }
      patchPendingChanges({
        name: '',
        username: '',
        password: '',
        role: 'cashier',
        adminPassword: '',
        adminPasswordError: '',
      })
      showToast(`${roleLabel(addedRole)} added successfully`)
    })
  }

  const handleDelete = (member) => {
    patchPendingChanges({ deleteConfirm: member })
  }

  const confirmDelete = () => {
    if (!deleteConfirm) return
    const member = deleteConfirm
    runDelete(async () => {
      const result = await deleteUser(member.id, user?.id)
      if (!result.ok) {
        showToast(result.error, 'error')
        return
      }
      showToast('User removed', 'info')
      patchPendingChanges({ deleteConfirm: null })
    })
  }

  const handleResetPassword = ({ newPassword, confirmPassword }) => {
    if (!resetMember) return
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }
    runReset(async () => {
      const result = resetUserPassword({ userId: resetMember.id, newPassword })
      if (!result.ok) {
        showToast(result.error || 'Could not reset password', 'error')
        return
      }
      showToast(`Password updated for ${resetMember.name}`)
      patchPendingChanges({ resetMember: null })
    })
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-8">
      <PageHeader
        icon={HiOutlineUserGroup}
        iconClassName="from-indigo-500 to-violet-600 shadow-indigo-500/25"
        title="Team"
        description="Add admins, cashiers, and managers. Reset passwords or remove users."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <HiOutlinePlusCircle className="w-5 h-5 text-violet-600" />
            Add team member
          </h2>
          <p className="text-slate-500 text-sm mb-5">
            Create a login for a cashier, manager{canAddAdmin ? ', or admin' : ''}.
          </p>
          <form onSubmit={handleAdd} className="space-y-4" autoComplete="off">
            <Input
              label="Full name"
              value={name}
              onChange={(e) => patchPendingChanges({ name: e.target.value })}
              placeholder="e.g. Priya Sharma"
              required
            />
            <Input
              label="Username"
              value={username}
              onChange={(e) => patchPendingChanges({ username: e.target.value })}
              placeholder="e.g. priya"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => patchPendingChanges({ password: e.target.value })}
              placeholder="Set a password"
              required
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
              <select
                value={role}
                onChange={(e) => {
                  patchPendingChanges({
                    role: e.target.value,
                    adminPassword: '',
                    adminPasswordError: '',
                  })
                }}
                className="field-select"
              >
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                {canAddAdmin && <option value="admin">Admin</option>}
              </select>
            </div>
            {role === 'admin' && (
              <Input
                label="Your admin password"
                type="password"
                hint="Required to confirm adding another admin"
                value={adminPassword}
                onChange={(e) => {
                  patchPendingChanges({ adminPassword: e.target.value, adminPasswordError: '' })
                }}
                error={adminPasswordError}
                placeholder="Enter your password to continue"
                required
              />
            )}
            <Button type="submit" loading={adding} className="w-full sm:w-auto">
              Add {roleLabel(role).toLowerCase()}
            </Button>
          </form>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">Team members</h2>
          {teamMembers.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10 border-2 border-dashed border-slate-200 rounded-md">
              No team members yet. Add someone using the form.
            </p>
          ) : (
            <>
            <ul className="rounded-md border border-slate-200 overflow-hidden">
              {paginatedMembers.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 bg-white border-b border-slate-300 last:border-b-0 hover:bg-slate-50"
                >
                  <TableIdentityCell
                    title={member.name}
                    subtitle={`@${member.username}`}
                    name={member.name}
                    subtitleClassName="text-slate-400 text-xs mt-0.5 truncate font-mono"
                    className="flex-1 min-w-0"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-md border text-xs font-bold capitalize ${ROLE_BADGE[member.role] || ''}`}
                    >
                      {roleLabel(member.role)}
                    </span>
                    <button
                      type="button"
                      onClick={() => patchPendingChanges({ resetMember: member })}
                      className={`${iconBtnClass} text-slate-500 hover:text-violet-700 hover:bg-violet-50`}
                      title="Reset password"
                      aria-label={`Reset password for ${member.name}`}
                    >
                      <HiOutlineKey className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(member)}
                      disabled={deleting}
                      className={`${iconBtnClass} text-red-400 hover:text-red-600 hover:bg-red-50`}
                      title="Remove user"
                      aria-label={`Remove ${member.name}`}
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageChange={setPage}
            />
            </>
          )}
        </Card>
      </div>

      <ResetPasswordDialog
        member={resetMember}
        open={!!resetMember}
        onClose={() => patchPendingChanges({ resetMember: null })}
        onSubmit={handleResetPassword}
        loading={resetting}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Remove team member?"
        message={
          deleteConfirm
            ? `Remove ${deleteConfirm.name} (@${deleteConfirm.username})? They will no longer be able to sign in.`
            : ''
        }
        confirmLabel="Remove user"
        variant="danger"
        confirmLoading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => patchPendingChanges({ deleteConfirm: null })}
      />
    </div>
  )
}
