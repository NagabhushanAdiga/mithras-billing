import { useEffect, useRef, useState, useCallback } from 'react'

const SCAN_RELAY_PORT = 3847

function resolveRelayUrl(explicitUrl) {
  if (explicitUrl) return explicitUrl
  if (import.meta.env.VITE_SCANNER_RELAY_URL) {
    return import.meta.env.VITE_SCANNER_RELAY_URL
  }
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${host}:${SCAN_RELAY_PORT}`
}

/**
 * Receives barcode scans from the Scan Me mobile app (same Wi‑Fi as this PC).
 * The relay starts automatically with `npm run dev` in the frontend folder.
 */
export function useMobileScanner(onScan, { active = true, url } = {}) {
  const onScanRef = useRef(onScan)
  const [status, setStatus] = useState({
    connected: false,
    relayReachable: false,
    scannerCount: 0,
    url: '',
  })

  onScanRef.current = onScan

  const reconnect = useCallback(() => {
    setStatus((prev) => ({ ...prev, connected: false }))
  }, [])

  useEffect(() => {
    if (!active) {
      setStatus((prev) => ({ ...prev, connected: false, relayReachable: false, scannerCount: 0 }))
      return undefined
    }

    const relayUrl = resolveRelayUrl(url)
    let ws
    let disposed = false
    let retryTimer

    const connect = () => {
      if (disposed) return
      ws = new WebSocket(relayUrl)

      ws.onopen = () => {
        if (disposed) return
        ws.send(JSON.stringify({ type: 'register', role: 'pos' }))
        setStatus((prev) => ({
          ...prev,
          connected: true,
          relayReachable: true,
          url: relayUrl,
        }))
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'scan' && msg.barcode) {
            onScanRef.current?.(String(msg.barcode))
            return
          }
          if (msg.type === 'status') {
            setStatus((prev) => ({
              ...prev,
              relayReachable: true,
              scannerCount: Number(msg.scannerCount) || 0,
            }))
          }
        } catch {
          // ignore malformed messages
        }
      }

      ws.onclose = () => {
        if (disposed) return
        setStatus((prev) => ({
          ...prev,
          connected: false,
          scannerCount: 0,
          url: relayUrl,
        }))
        retryTimer = window.setTimeout(connect, 2500)
      }

      ws.onerror = () => {
        setStatus((prev) => ({
          ...prev,
          connected: false,
          relayReachable: false,
          url: relayUrl,
        }))
      }
    }

    setStatus((prev) => ({ ...prev, url: relayUrl }))
    connect()

    return () => {
      disposed = true
      window.clearTimeout(retryTimer)
      ws?.close()
    }
  }, [active, url])

  return { status, reconnect }
}
