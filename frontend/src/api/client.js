const TOKEN_KEY = 'billing_token'

export const API_BASE = import.meta.env.VITE_API_URL || ''
export const USE_API = Boolean(API_BASE)

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}
