import { getRequest, postRequest, putRequest, deleteRequest } from '../request.js'

const list = () => getRequest('/products')

const create = (product) => postRequest('/products', product)

const update = (id, updates) => putRequest(`/products/${id}`, updates)

const remove = (id) => deleteRequest(`/products/${id}`)

export { list, create, update, remove }
