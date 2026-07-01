import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { INITIAL_USERS } from '../data/staticData'
import { logAudit } from '../utils/auditLog'
import { isAdminRole } from '../utils/roles'
import { USE_API, getToken, setToken } from '../api/client'
import {
  login as apiLogin,
  me as apiMe,
  logout as apiLogout,
  changePassword as apiChangePassword,
  verifyPassword as apiVerifyPassword,
} from '../api/services/authService'
import {
  list as listTeamMembers,
  create as createUser,
  remove as removeUser,
  resetPassword,
} from '../api/services/userService'

const STORAGE_KEYS = {
  user: 'billing_user',
  users: 'billing_users',
}

function loadUsers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.users)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // fall through
  }
  return INITIAL_USERS
}

function toPublicUser(user) {
  const { password: _, ...rest } = user
  return rest
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [accounts, setAccounts] = useState(loadUsers)
  const [teamMembers, setTeamMembers] = useState([])
  const [user, setUser] = useState(() => {
    if (USE_API) return null
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.user)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [isAuthReady, setIsAuthReady] = useState(!USE_API)

  useEffect(() => {
    if (!USE_API) {
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(accounts))
    }
  }, [accounts])

  const loadTeamMembers = useCallback(async () => {
    if (!USE_API) return
    try {
      const { teamMembers: members } = await listTeamMembers()
      setTeamMembers(members)
    } catch {
      setTeamMembers([])
    }
  }, [])

  useEffect(() => {
    if (!USE_API) {
      setIsAuthReady(true)
      return
    }

    const token = getToken()
    if (!token) {
      setIsAuthReady(true)
      return
    }

    apiMe()
      .then(async (data) => {
        const current = data?.user
        if (!current) {
          setToken(null)
          setUser(null)
          return
        }
        setUser(current)
        if (isAdminRole(current.role)) await loadTeamMembers()
      })
      .catch(() => {
        setToken(null)
        setUser(null)
      })
      .finally(() => setIsAuthReady(true))
  }, [loadTeamMembers])

  const login = useCallback(
    async (username, password) => {
      if (USE_API) {
        try {
          const { user: loggedIn, token } = await apiLogin(username, password)
          if (!loggedIn || !token) {
            return { success: false, error: 'Invalid login response from server' }
          }
          setToken(token)
          setUser(loggedIn)
          logAudit('login', {
            category: 'auth',
            details: `Signed in as ${loggedIn.username} (${loggedIn.role})`,
            actor: loggedIn,
          })
          if (isAdminRole(loggedIn.role)) await loadTeamMembers()
          return { success: true, user: loggedIn }
        } catch (err) {
          if (err.networkError && accounts.length > 0) {
            const found = accounts.find(
              (u) =>
                u.username.toLowerCase() === username.trim().toLowerCase() &&
                u.password === password
            )
            if (found) {
              const userData = toPublicUser(found)
              setUser(userData)
              localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userData))
              return { success: true, user: userData }
            }
          }
          return {
            success: false,
            error: err.message || 'Invalid username or password',
          }
        }
      }

      const found = accounts.find(
        (u) =>
          u.username.toLowerCase() === username.trim().toLowerCase() &&
          u.password === password
      )
      if (found) {
        const userData = toPublicUser(found)
        setUser(userData)
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userData))
        logAudit('login', {
          category: 'auth',
          details: `Signed in as ${userData.username} (${userData.role})`,
          actor: userData,
        })
        return { success: true, user: userData }
      }
      return { success: false, error: 'Invalid username or password' }
    },
    [accounts, loadTeamMembers]
  )

  const logout = useCallback(async () => {
    if (user) {
      logAudit('logout', {
        category: 'auth',
        details: `Signed out (${user.username})`,
        actor: user,
      })
    }
    if (USE_API) {
      try {
        await apiLogout()
      } catch {
        // ignore
      }
      setToken(null)
    } else {
      localStorage.removeItem(STORAGE_KEYS.user)
    }
    setUser(null)
    setTeamMembers([])
  }, [user])

  const addUser = useCallback(
    async ({ name, username, password, role, adminPassword }) => {
      const trimmedName = String(name).trim()
      const trimmedUsername = String(username).trim().toLowerCase()
      const trimmedPassword = String(password)

      if (!trimmedName || !trimmedUsername || !trimmedPassword) {
        return { ok: false, error: 'All fields are required' }
      }
      if (!['cashier', 'manager', 'admin'].includes(role)) {
        return { ok: false, error: 'Role must be cashier, manager, or admin' }
      }

      if (role === 'admin') {
        const trimmedAdminPassword = String(adminPassword || '').trim()
        if (!trimmedAdminPassword) {
          return { ok: false, error: 'Your password is required to add an admin' }
        }
        if (!user || !isAdminRole(user.role)) {
          return { ok: false, error: 'Only admins can add admin users' }
        }
        if (USE_API) {
          // verified on server
        } else {
          const account = accounts.find((u) => u.id === user.id)
          if (!account || account.password !== trimmedAdminPassword) {
            return { ok: false, error: 'Incorrect password' }
          }
        }
      }

      if (USE_API) {
        try {
          const { id } = await createUser({
            name: trimmedName,
            username: trimmedUsername,
            password: trimmedPassword,
            role,
            ...(role === 'admin' ? { adminPassword: String(adminPassword || '').trim() } : {}),
          })
          await loadTeamMembers()
          return { ok: true, id }
        } catch (err) {
          return { ok: false, error: err.message }
        }
      }

      if (accounts.some((u) => u.username.toLowerCase() === trimmedUsername)) {
        return { ok: false, error: 'Username already exists' }
      }
      const id = `usr-${Date.now()}`
      setAccounts((prev) => [
        ...prev,
        { id, username: trimmedUsername, password: trimmedPassword, name: trimmedName, role },
      ])
      logAudit('user_added', {
        category: 'team',
        details: `${trimmedName} (@${trimmedUsername}) · ${role}`,
      })
      return { ok: true, id }
    },
    [accounts, loadTeamMembers, user]
  )

  const deleteUser = useCallback(
    async (id, currentUserId) => {
      if (USE_API) {
        try {
          await removeUser(id)
          await loadTeamMembers()
          return { ok: true }
        } catch (err) {
          return { ok: false, error: err.message }
        }
      }

      const target = accounts.find((u) => u.id === id)
      if (!target) return { ok: false, error: 'User not found' }
      if (id === currentUserId) return { ok: false, error: 'Cannot delete your own account' }
      setAccounts((prev) => prev.filter((u) => u.id !== id))
      logAudit('user_deleted', {
        category: 'team',
        details: `${target.name} (@${target.username})`,
      })
      return { ok: true }
    },
    [accounts, loadTeamMembers, user]
  )

  const verifyPassword = useCallback(
    async (password) => {
      if (USE_API) {
        try {
          const { valid } = await apiVerifyPassword(password)
          return valid
        } catch {
          return false
        }
      }
      if (!user) return false
      const account = accounts.find((u) => u.id === user.id)
      return Boolean(account && account.password === password)
    },
    [accounts, user]
  )

  const changePassword = useCallback(
    async ({ currentPassword, newPassword }) => {
      if (!user) return { ok: false, error: 'Not signed in' }
      if (!isAdminRole(user.role)) return { ok: false, error: 'Only admin can change password here' }

      const trimmedNew = String(newPassword || '').trim()
      if (trimmedNew.length < 4) {
        return { ok: false, error: 'New password must be at least 4 characters' }
      }

      if (USE_API) {
        try {
          await apiChangePassword({ currentPassword, newPassword: trimmedNew })
          logAudit('password_changed', { category: 'team', details: 'Admin password updated' })
          return { ok: true }
        } catch (err) {
          return { ok: false, error: err.message }
        }
      }

      const account = accounts.find((u) => u.id === user.id)
      if (!account) return { ok: false, error: 'Account not found' }
      if (account.password !== currentPassword) {
        return { ok: false, error: 'Current password is incorrect' }
      }

      setAccounts((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, password: trimmedNew } : u))
      )
      logAudit('password_changed', { category: 'team', details: 'Admin password updated' })
      return { ok: true }
    },
    [accounts, user]
  )

  const resetUserPassword = useCallback(
    async ({ userId, newPassword }) => {
      if (!user || !isAdminRole(user.role)) {
        return { ok: false, error: 'Only admin can reset team passwords' }
      }

      const trimmedNew = String(newPassword || '').trim()
      if (trimmedNew.length < 4) {
        return { ok: false, error: 'Password must be at least 4 characters' }
      }

      if (USE_API) {
        try {
          await resetPassword(userId, trimmedNew)
          logAudit('password_reset', {
            category: 'team',
            details: `Password reset for user ${userId}`,
          })
          return { ok: true }
        } catch (err) {
          return { ok: false, error: err.message }
        }
      }

      const target = accounts.find((u) => u.id === userId)
      if (!target) return { ok: false, error: 'User not found' }

      setAccounts((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, password: trimmedNew } : u))
      )
      logAudit('password_reset', {
        category: 'team',
        details: `Password reset for ${target.name} (@${target.username})`,
      })
      return { ok: true }
    },
    [accounts, user]
  )

  const localTeamMembers = accounts
    .filter((u) => ['cashier', 'manager', 'admin'].includes(u.role))
    .map(toPublicUser)

  return (
    <AuthContext.Provider
      value={{
        user,
        accounts,
        login,
        logout,
        isAuthenticated: !!user,
        isAuthReady,
        teamMembers: USE_API ? teamMembers : localTeamMembers,
        addUser,
        deleteUser,
        changePassword,
        resetUserPassword,
        verifyPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/**
 * Orders visible to the current user on Recently billed.
 */
export function filterOrdersForUser(orders, user) {
  if (!user) return []
  if (isAdminRole(user.role)) return orders
  return orders.filter(
    (o) =>
      o.createdBy?.id === user.id ||
      o.createdBy?.username === user.username
  )
}
