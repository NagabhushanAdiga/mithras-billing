import { getRequest, postRequest, deleteRequest } from '../request.js'

const list = () => getRequest('/batches')

const create = (name) => postRequest('/batches', { name })

const remove = (id) => deleteRequest(`/batches/${id}`)

export { list, create, remove }
