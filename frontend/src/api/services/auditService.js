import { getRequest, postRequest, deleteRequest } from '../request.js'

const list = (category = '') =>
  getRequest(category ? `/audit?category=${encodeURIComponent(category)}` : '/audit')

const create = (body) => postRequest('/audit', body)

const clear = () => deleteRequest('/audit')

export { list, create, clear }
