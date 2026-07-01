import { getRequest, postRequest, putRequest, deleteRequest } from '../request.js'

const list = () => getRequest('/groups')

const create = (name) => postRequest('/groups', { name })

const update = (id, name) => putRequest(`/groups/${id}`, { name })

const remove = (id) => deleteRequest(`/groups/${id}`)

export { list, create, update, remove }
