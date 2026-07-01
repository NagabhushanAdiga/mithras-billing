import { WebSocketServer } from 'ws'

const PORT = Number(process.env.SCAN_RELAY_PORT) || 3847

function send(ws, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload))
  }
}

/**
 * Starts a small WebSocket relay when `npm run dev` runs so the mobile app
 * on the same Wi‑Fi can send barcodes straight to the open POS page.
 */
export function scanRelayPlugin() {
  let wss

  const startRelay = () => {
    if (wss) return

    const posClients = new Set()
    const scannerClients = new Set()

    const broadcastStatus = () => {
      const status = {
        type: 'status',
        posConnected: posClients.size > 0,
        scannerCount: scannerClients.size,
      }
      for (const client of [...posClients, ...scannerClients]) {
        send(client, status)
      }
    }

    wss = new WebSocketServer({ port: PORT, host: '0.0.0.0' })

    wss.on('connection', (ws) => {
      ws.role = null

      ws.on('message', (raw) => {
        let msg
        try {
          msg = JSON.parse(String(raw))
        } catch {
          return
        }

        if (msg.type === 'register' && (msg.role === 'pos' || msg.role === 'scanner')) {
          ws.role = msg.role
          if (msg.role === 'pos') posClients.add(ws)
          if (msg.role === 'scanner') scannerClients.add(ws)
          send(ws, { type: 'registered', role: msg.role })
          broadcastStatus()
          return
        }

        if (msg.type === 'scan' && ws.role === 'scanner') {
          const barcode = String(msg.barcode || '').trim()
          if (!barcode) return

          let delivered = 0
          for (const pos of posClients) {
            send(pos, { type: 'scan', barcode, source: 'mobile' })
            delivered += 1
          }

          send(ws, { type: 'ack', barcode, delivered, ok: delivered > 0 })
          return
        }

        if (msg.type === 'ping') {
          send(ws, { type: 'pong' })
        }
      })

      ws.on('close', () => {
        if (ws.role === 'pos') posClients.delete(ws)
        if (ws.role === 'scanner') scannerClients.delete(ws)
        if (ws.role) broadcastStatus()
      })
    })

    console.log(`[scan-relay] mobile scanner ready on ws://0.0.0.0:${PORT}`)
    console.log('[scan-relay] use your PC LAN IP in Scan Me, e.g. ws://192.168.1.3:3847')
  }

  const stopRelay = () => {
    wss?.close()
    wss = undefined
  }

  return {
    name: 'scan-relay',
    configureServer(server) {
      startRelay()
      server.httpServer?.on('close', stopRelay)
    },
    buildEnd() {
      stopRelay()
    },
  }
}
