import { useAuth } from '../../context/AuthContext'
import Button from '../common/Button'
import Input from '../common/Input'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { usePendingChanges } from '../../hooks/usePendingChanges'

const INITIAL = { username: '', password: '', error: '' }

export default function LoginForm({ onSuccess }) {
  const { pendingChanges, patchPendingChanges } = usePendingChanges(INITIAL)
  const { username, password, error } = pendingChanges
  const { login } = useAuth()
  const { loading, run } = useAsyncAction()

  const handleSubmit = (e) => {
    e.preventDefault()
    patchPendingChanges({ error: '' })
    run(async () => {
      const result = await login(username, password)
      if (result.success) {
        onSuccess?.()
      } else {
        patchPendingChanges({ error: result.error || 'Login failed' })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
      <Input
        label="Username"
        type="text"
        value={username}
        onChange={(e) => patchPendingChanges({ username: e.target.value })}
        placeholder="Enter your username"
        required
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => patchPendingChanges({ password: e.target.value })}
        placeholder="Enter your password"
        required
      />
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
      )}
      <Button type="submit" className="w-full py-3" loading={loading}>
        Sign in
      </Button>
    </form>
  )
}
