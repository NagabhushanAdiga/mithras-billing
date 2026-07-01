import { getRequest, postRequest } from '../request.js'

const login = (username, password) =>
  postRequest('/auth/login', { username, password }, { auth: false })

const me = () => getRequest('/auth/me')

const logout = () => postRequest('/auth/logout')

const changePassword = (body) => postRequest('/auth/change-password', body)

const verifyPassword = (password) => postRequest('/auth/verify-password', { password })

export { login, me, logout, changePassword, verifyPassword }
