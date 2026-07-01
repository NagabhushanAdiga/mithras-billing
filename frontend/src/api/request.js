import { API_BASE, getToken } from './client.js'

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    const err = new Error(
      'Cannot reach the server. Start the backend: cd backend && npm run dev'
    )
    err.status = 0
    err.networkError = true
    throw err
  }

  let payload
  try {
    payload = await res.json()
  } catch {
    payload = { ok: false, error: res.statusText || 'Request failed' }
  }

  if (!res.ok || payload.ok === false) {
    const err = new Error(payload.error || 'Request failed')
    err.status = res.status
    throw err
  }

  return payload.data
}

export const getRequest = (path, options) => request(path, { ...options, method: 'GET' })

export const postRequest = (path, body, options) =>
  request(path, { ...options, method: 'POST', body })

export const putRequest = (path, body, options) =>
  request(path, { ...options, method: 'PUT', body })

export const patchRequest = (path, body, options) =>
  request(path, { ...options, method: 'PATCH', body })

export const deleteRequest = (path, options) =>
  request(path, { ...options, method: 'DELETE' })
