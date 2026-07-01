import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'billing_support_tickets'

const SupportContext = createContext(null)

function loadTickets() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function SupportProvider({ children }) {
  const [tickets, setTickets] = useState(loadTickets)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
  }, [tickets])

  const addTicket = useCallback((ticket) => {
    const id = `tkt-${Date.now()}`
    const entry = {
      id,
      ticketNo: `TK-${String(tickets.length + 1).padStart(4, '0')}`,
      status: 'open',
      createdAt: new Date().toISOString(),
      ...ticket,
    }
    setTickets((prev) => [entry, ...prev])
    return entry
  }, [tickets.length])

  const updateTicketStatus = useCallback((id, status) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t))
    )
  }, [])

  const clearAllTickets = useCallback(() => {
    setTickets([])
  }, [])

  return (
    <SupportContext.Provider value={{ tickets, addTicket, updateTicketStatus, clearAllTickets }}>
      {children}
    </SupportContext.Provider>
  )
}

export function useSupport() {
  const ctx = useContext(SupportContext)
  if (!ctx) throw new Error('useSupport must be used within SupportProvider')
  return ctx
}
