import { postRequest, putRequest, deleteRequest } from '../request.js'

const create = (groupId, name) =>
  postRequest(`/groups/${groupId}/subcategories`, { name })

const update = (groupId, subcategoryId, name) =>
  putRequest(`/groups/${groupId}/subcategories/${subcategoryId}`, { name })

const remove = (groupId, subcategoryId) =>
  deleteRequest(`/groups/${groupId}/subcategories/${subcategoryId}`)

export { create, update, remove }
