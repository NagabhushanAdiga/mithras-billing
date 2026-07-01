import { getRequest, postRequest, patchRequest, deleteRequest } from '../request.js'

const list = () => getRequest('/users')

const create = (body) => postRequest('/users', body)

const remove = (id) => deleteRequest(`/users/${id}`)

const resetPassword = (id, newPassword) =>
  patchRequest(`/users/${id}/password`, { newPassword })

export { list, create, remove, resetPassword }
