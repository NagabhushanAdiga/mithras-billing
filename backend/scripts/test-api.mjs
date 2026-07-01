/**
 * Full backend API smoke test.
 * Usage:
 *   node scripts/test-api.mjs
 *   node scripts/test-api.mjs https://mithras-billing.vercel.app/api
 *   API_BASE=http://localhost:4000/api node scripts/test-api.mjs
 */

const BASE = process.argv[2] || process.env.API_BASE || 'http://127.0.0.1:4000/api'
const ADMIN_USER = process.env.TEST_USERNAME || 'naga'
const ADMIN_PASS = process.env.TEST_PASSWORD || '12345'

let token = ''
let passed = 0
let failed = 0
const failures = []

function assert(name, condition, detail = '') {
  if (condition) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    const msg = detail ? `${name}: ${detail}` : name
    failures.push(msg)
    console.log(`  ✗ ${msg}`)
  }
}

async function api(method, path, { body, auth = true, expectStatus } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth && token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  let data = null
  const text = await res.text()
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { ok: false, error: text.slice(0, 200) }
  }
  if (expectStatus !== undefined && res.status !== expectStatus) {
    throw new Error(`${method} ${path} expected ${expectStatus}, got ${res.status}: ${text.slice(0, 120)}`)
  }
  return { res, data }
}

async function run() {
  console.log(`\nTesting API: ${BASE}\n`)

  // --- Public ---
  console.log('Public')
  let { res, data } = await api('GET', '/health', { auth: false })
  assert('GET /health → 200', res.status === 200)
  assert('health database connected', data?.database === 'connected', JSON.stringify(data))

  ;({ res, data } = await api('POST', '/auth/login', {
    auth: false,
    body: { username: ADMIN_USER, password: 'wrong-password' },
    expectStatus: 401,
  }))
  assert('POST /auth/login wrong password → 401', res.status === 401)

  ;({ res, data } = await api('POST', '/auth/login', {
    auth: false,
    body: { username: ADMIN_USER, password: ADMIN_PASS },
    expectStatus: 200,
  }))
  assert('POST /auth/login → 200', res.status === 200 && data?.ok === true)
  token = data?.data?.token || ''
  assert('login returns token', Boolean(token))

  // --- Auth ---
  console.log('\nAuth')
  ;({ res, data } = await api('GET', '/auth/me'))
  assert('GET /auth/me → 200', res.status === 200 && data?.data?.user?.username === ADMIN_USER)

  ;({ res, data } = await api('POST', '/auth/verify-password', { body: { password: ADMIN_PASS } }))
  assert('POST /auth/verify-password valid', data?.data?.valid === true)

  // --- Read endpoints (shape checks) ---
  console.log('\nRead endpoints')
  ;({ data } = await api('GET', '/products'))
  assert('GET /products returns products[]', Array.isArray(data?.data?.products))

  ;({ data } = await api('GET', '/groups'))
  assert('GET /groups returns groups[]', Array.isArray(data?.data?.groups))

  ;({ data } = await api('GET', '/batches'))
  assert('GET /batches returns batches[]', Array.isArray(data?.data?.batches))

  ;({ data } = await api('GET', '/orders'))
  assert('GET /orders returns orders[]', Array.isArray(data?.data?.orders))

  ;({ data } = await api('GET', '/settings'))
  assert('GET /settings returns settings', data?.data?.settings != null)

  ;({ data } = await api('GET', '/users'))
  assert('GET /users returns teamMembers[]', Array.isArray(data?.data?.teamMembers))

  ;({ data } = await api('GET', '/audit'))
  assert('GET /audit returns entries[]', Array.isArray(data?.data?.entries))

  ;({ data } = await api('GET', '/store/bootstrap'))
  assert('GET /store/bootstrap has products', Array.isArray(data?.data?.products))
  assert('GET /store/bootstrap has orders', Array.isArray(data?.data?.orders))

  // --- Product CRUD ---
  console.log('\nProduct CRUD')
  const testName = `Test Product ${Date.now()}`
  ;({ res, data } = await api('POST', '/products', {
    body: { name: testName, price: 99, stock: 5, category: 'Other' },
    expectStatus: 201,
  }))
  const productId = data?.data?.product?.id
  assert('POST /products creates product', Boolean(productId))

  if (productId) {
    ;({ data } = await api('GET', `/products/barcode/${data.data.product.barcode}`))
    assert('GET /products/barcode/:barcode', data?.data?.product?.id === productId)

    ;({ data } = await api('PUT', `/products/${productId}`, {
      body: { price: 150 },
    }))
    assert('PUT /products/:id', data?.data?.product?.price === 150)

    ;({ res } = await api('DELETE', `/products/${productId}`))
    assert('DELETE /products/:id', res.status === 200)
  }

  // --- Batch CRUD ---
  console.log('\nBatch CRUD')
  const batchName = `Test Batch ${Date.now()}`
  ;({ res, data } = await api('POST', '/batches', { body: { name: batchName }, expectStatus: 201 }))
  const batchId = data?.data?.batch?.id
  assert('POST /batches', Boolean(batchId))
  if (batchId) {
    ;({ res } = await api('DELETE', `/batches/${batchId}`))
    assert('DELETE /batches/:id', res.status === 200)
  }

  // --- Group CRUD ---
  console.log('\nGroup CRUD')
  const groupName = `Test Group ${Date.now()}`
  ;({ res, data } = await api('POST', '/groups', { body: { name: groupName }, expectStatus: 201 }))
  const groupId = data?.data?.group?.id
  assert('POST /groups', Boolean(groupId))
  if (groupId) {
    ;({ data } = await api('PUT', `/groups/${groupId}`, { body: { name: groupName + ' X' } }))
    assert('PUT /groups/:id', Boolean(data?.data?.group))

    ;({ res, data } = await api('POST', `/groups/${groupId}/subcategories`, {
      body: { name: 'Test Sub' },
      expectStatus: 201,
    }))
    const subId = data?.data?.subcategory?.id
    assert('POST /groups/:id/subcategories', Boolean(subId))

    if (subId) {
      ;({ res } = await api('DELETE', `/groups/${groupId}/subcategories/${subId}`))
      assert('DELETE subcategory', res.status === 200)
    }

    ;({ res } = await api('DELETE', `/groups/${groupId}`))
    assert('DELETE /groups/:id', res.status === 200)
  }

  // --- Settings ---
  console.log('\nSettings')
  ;({ data } = await api('GET', '/settings'))
  const storeName = data?.data?.settings?.storeName || 'SuperMart'
  ;({ res, data } = await api('PUT', '/settings', {
    body: { storeName },
  }))
  assert('PUT /settings', res.status === 200)

  // --- Audit ---
  console.log('\nAudit')
  ;({ res, data } = await api('POST', '/audit', {
    body: { action: 'api_smoke_test', category: 'system', details: 'automated test' },
    expectStatus: 201,
  }))
  assert('POST /audit', Boolean(data?.data?.entry?.id))

  ;({ data } = await api('GET', '/audit'))
  assert('audit list includes test entry', data?.data?.entries?.some((e) => e.action === 'api_smoke_test'))

  // --- Auth logout ---
  console.log('\nLogout')
  ;({ res } = await api('POST', '/auth/logout'))
  assert('POST /auth/logout', res.status === 200)

  // --- Unauthorized ---
  console.log('\nAuth guards')
  ;({ res } = await api('GET', '/products', { auth: false, expectStatus: 401 }))
  assert('GET /products without token → 401', res.status === 401)

  console.log(`\n${'─'.repeat(40)}`)
  console.log(`Passed: ${passed}  Failed: ${failed}`)
  if (failures.length) {
    console.log('\nFailures:')
    failures.forEach((f) => console.log(`  - ${f}`))
    process.exit(1)
  }
  console.log('All tests passed.\n')
}

run().catch((err) => {
  console.error('\nTest run error:', err.message)
  process.exit(1)
})
