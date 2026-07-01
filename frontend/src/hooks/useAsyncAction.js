import { useCallback, useState } from 'react'

export function useAsyncAction() {
  const [loading, setLoading] = useState(false)

  const run = useCallback(async (fn, minMs = 400) => {
    setLoading(true)
    const start = Date.now()
    try {
      return await fn()
    } finally {
      const elapsed = Date.now() - start
      if (elapsed < minMs) {
        await new Promise((resolve) => setTimeout(resolve, minMs - elapsed))
      }
      setLoading(false)
    }
  }, [])

  return { loading, run }
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
