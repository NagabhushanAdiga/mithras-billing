import { getRequest, postRequest } from '../request.js'

const bootstrap = () => getRequest('/store/bootstrap')

const eraseAll = () => postRequest('/store/erase')

const purge = (options) => postRequest('/store/purge', options)

export { bootstrap, eraseAll, purge }
