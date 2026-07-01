import { getRequest, putRequest } from '../request.js'

const getSettings = () => getRequest('/settings')

const update = (settings) => putRequest('/settings', settings)

export { getSettings, update }
