import { useEffect, useState } from 'react'

export function usePageLoading(active = true, ms = 380) {
  const [loading, setLoading] = useState(active)

  useEffect(() => {
    if (!active) {
      setLoading(false)
      return undefined
    }
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), ms)
    return () => clearTimeout(timer)
  }, [active, ms])

  return loading
}
