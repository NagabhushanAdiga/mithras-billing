import { getRequest, postRequest } from '../request.js'

const list = () => getRequest('/orders')

const create = (order) => postRequest('/orders', order)

export { list, create }
