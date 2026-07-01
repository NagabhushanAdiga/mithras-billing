import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { INITIAL_PRODUCTS, INITIAL_GROUPS, INITIAL_BATCHES, DEFAULT_SETTINGS, SAMPLE_ORDERS } from '../data/staticData'
import { productImageSrc } from '../utils/productImage'
import { isBarcodeTaken, generateUniqueBarcode } from '../utils/barcode'
import { applyBatchesToProduct, getProductBatches } from '../utils/productBatches'
import { normalizeGroups, resolveProductCategoryFields } from '../utils/categories'
import { normalizeGst } from '../utils/billing'
import { logAudit } from '../utils/auditLog'
import { generateUniqueInvoiceId } from '../utils/invoiceId'
import { USE_API } from '../api/client'
import { bootstrap, eraseAll, purge } from '../api/services/storeService'
import { create as createProduct, update as updateProduct, remove as removeProduct } from '../api/services/productService'
import { create as createCategory, update as updateCategory, remove as removeCategory } from '../api/services/categoryService'
import {
  create as createSubcategory,
  update as updateSubcategory,
  remove as removeSubcategory,
} from '../api/services/subcategoryService'
import { create as createBatch, remove as removeBatch } from '../api/services/batchService'
import { create as createOrder } from '../api/services/orderService'
import { update as updateSettings } from '../api/services/settingsService'
import { useAuth } from './AuthContext'

const STORAGE_KEYS = {
  products: 'billing_products',
  groups: 'billing_groups',
  batches: 'billing_batches',
  orders: 'billing_orders',
  settings: 'billing_settings',
}

function loadJson(key, fallback) {
  try {
    const s = localStorage.getItem(key)
    return s ? JSON.parse(s) : fallback
  } catch {
    return fallback
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function normalizeHsn(value) {
  return String(value || '').trim().replace(/\s/g, '')
}

function applyCategoryToProduct(product, groups) {
  return { ...product, ...resolveProductCategoryFields(product, groups) }
}

function normalizeProducts(products, groups, batches = []) {
  const categoryToGroup = Object.fromEntries(
    INITIAL_GROUPS.map((g) => [g.name, g.id])
  )
  groups.forEach((g) => {
    categoryToGroup[g.name] = g.id
  })

  return products.map((p) => {
    const groupId =
      p.groupId ||
      (p.category ? categoryToGroup[p.category] : '') ||
      ''
    const group = groupId ? groups.find((g) => g.id === groupId) : null
    const legacyBatch = p.batchId
      ? batches.find((b) => b.id === p.batchId)?.name
      : ''
    const batchLabel = String(p.batch || legacyBatch || '').trim()
    const { batchId: _removed, ...rest } = p
    const normalizedBatches = getProductBatches(
      { ...rest, batch: batchLabel, batches: p.batches },
      batches
    )
    const withBatches = applyBatchesToProduct(
      { ...rest, batch: batchLabel },
      normalizedBatches
    )
    return applyCategoryToProduct(
      {
        ...withBatches,
        discount: Number(p.discount) || 0,
        hsn: normalizeHsn(p.hsn),
        gst: normalizeGst(p.gst),
        image: p.image || productImageSrc({ ...p, id: p.id }),
      },
      groups
    )
  })
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const [groups, setGroups] = useState(() =>
    USE_API ? [] : normalizeGroups(loadJson(STORAGE_KEYS.groups, INITIAL_GROUPS))
  )
  const [batches, setBatches] = useState(() => (USE_API ? [] : loadJson(STORAGE_KEYS.batches, INITIAL_BATCHES)))
  const [products, setProducts] = useState(() => {
    if (USE_API) return []
    const loaded = loadJson(STORAGE_KEYS.products, INITIAL_PRODUCTS)
    const grp = normalizeGroups(loadJson(STORAGE_KEYS.groups, INITIAL_GROUPS))
    const bat = loadJson(STORAGE_KEYS.batches, INITIAL_BATCHES)
    return normalizeProducts(loaded, grp, bat)
  })
  const [orders, setOrders] = useState(() => (USE_API ? [] : loadJson(STORAGE_KEYS.orders, SAMPLE_ORDERS)))
  const [settings, setSettingsState] = useState(() =>
    USE_API ? { ...DEFAULT_SETTINGS } : { ...DEFAULT_SETTINGS, ...loadJson(STORAGE_KEYS.settings, {}) }
  )
  const [isStoreReady, setIsStoreReady] = useState(!USE_API)

  const applyServerData = useCallback((data) => {
    const nextGroups = normalizeGroups(data.groups || [])
    const nextBatches = data.batches || []
    setGroups(nextGroups)
    setBatches(nextBatches)
    setProducts(normalizeProducts(data.products || [], nextGroups, nextBatches))
    setOrders(data.orders || [])
    setSettingsState({ ...DEFAULT_SETTINGS, ...(data.settings || {}) })
  }, [])

  const reloadStore = useCallback(async () => {
    const data = await bootstrap()
    applyServerData(data)
  }, [applyServerData])

  useEffect(() => {
    if (!USE_API) {
      const timer = setTimeout(() => setIsStoreReady(true), 350)
      return () => clearTimeout(timer)
    }
    if (!isAuthenticated || !user) {
      setIsStoreReady(false)
      return undefined
    }
    let cancelled = false
    setIsStoreReady(false)
    reloadStore()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsStoreReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user?.id, reloadStore])

  useEffect(() => {
    if (USE_API) return
    saveJson(STORAGE_KEYS.groups, groups)
  }, [groups])

  useEffect(() => {
    if (USE_API) return
    saveJson(STORAGE_KEYS.batches, batches)
  }, [batches])

  useEffect(() => {
    if (USE_API) return
    saveJson(STORAGE_KEYS.products, products)
  }, [products])

  useEffect(() => {
    if (USE_API) return
    saveJson(STORAGE_KEYS.orders, orders)
  }, [orders])

  useEffect(() => {
    if (USE_API) return
    saveJson(STORAGE_KEYS.settings, settings)
  }, [settings])

  const setSettings = useCallback((next) => {
    setSettingsState((prev) => {
      const merged = typeof next === 'function' ? next(prev) : { ...prev, ...next }
      if (USE_API) {
        updateSettings(merged).catch(() => {})
      }
      return merged
    })
  }, [])

  const getGroupById = useCallback(
    (groupId) => groups.find((g) => g.id === groupId),
    [groups]
  )

  const getBatchById = useCallback(
    (batchId) => batches.find((b) => b.id === batchId),
    [batches]
  )

  const addBatch = useCallback(async (name) => {
    const trimmed = String(name).trim()
    if (!trimmed) return null
    if (USE_API) {
      try {
        const { batch } = await createBatch(trimmed)
        await reloadStore()
        return batch.id
      } catch {
        return null
      }
    }
    const exists = batches.some((b) => b.name.toLowerCase() === trimmed.toLowerCase())
    if (exists) return null
    const id = `bat-${Date.now()}`
    setBatches((prev) => [...prev, { id, name: trimmed }])
    logAudit('batch_created', { category: 'category', details: trimmed })
    return id
  }, [batches, reloadStore])

  const deleteBatch = useCallback(async (id) => {
    if (USE_API) {
      try {
        await removeBatch(id)
        await reloadStore()
      } catch {
        // ignore
      }
      return
    }
    const batch = batches.find((b) => b.id === id)
    setBatches((prev) => prev.filter((b) => b.id !== id))
    setProducts((prods) =>
      prods.map((p) => (p.batchId === id ? { ...p, batch: '', batchId: '' } : p))
    )
    logAudit('batch_deleted', { category: 'category', details: batch?.name || id })
  }, [batches, reloadStore])

  const addGroup = useCallback(async (name) => {
    const trimmed = String(name).trim()
    if (!trimmed) return null
    if (USE_API) {
      try {
        const { group } = await createCategory(trimmed)
        await reloadStore()
        return group.id
      } catch {
        return null
      }
    }
    const exists = groups.some((g) => g.name.toLowerCase() === trimmed.toLowerCase())
    if (exists) return null
    const id = `grp-${Date.now()}`
    setGroups((prev) => [...prev, { id, name: trimmed, subcategories: [] }])
    logAudit('category_created', { category: 'category', details: trimmed })
    return id
  }, [groups, reloadStore])

  const updateGroup = useCallback(async (id, name) => {
    const trimmed = String(name).trim()
    if (!trimmed) return false
    if (USE_API) {
      try {
        await updateCategory(id, trimmed)
        await reloadStore()
        return true
      } catch {
        return false
      }
    }
    const exists = groups.some(
      (g) => g.id !== id && g.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (exists) return false

    const nextGroups = groups.map((g) =>
      g.id === id ? { ...g, name: trimmed } : g
    )
    setGroups(nextGroups)
    setProducts((prods) =>
      prods.map((p) =>
        p.groupId === id ? applyCategoryToProduct(p, nextGroups) : p
      )
    )
    logAudit('category_updated', { category: 'category', details: trimmed })
    return true
  }, [groups, reloadStore])

  const addSubcategory = useCallback(async (groupId, name) => {
    const trimmed = String(name).trim()
    if (!trimmed) return null
    if (USE_API) {
      try {
        const { subcategory } = await createSubcategory(groupId, trimmed)
        await reloadStore()
        return subcategory.id
      } catch {
        return null
      }
    }
    const group = groups.find((g) => g.id === groupId)
    if (!group) return null
    const subs = group.subcategories || []
    if (subs.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return null
    const id = `sub-${Date.now()}`
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, subcategories: [...(g.subcategories || []), { id, name: trimmed }] }
          : g
      )
    )
    logAudit('subcategory_created', {
      category: 'category',
      details: `${group.name} → ${trimmed}`,
    })
    return id
  }, [groups, reloadStore])

  const updateSubcategory = useCallback(async (groupId, subcategoryId, name) => {
    const trimmed = String(name).trim()
    if (!trimmed) return false
    if (USE_API) {
      try {
        await updateSubcategory(groupId, subcategoryId, trimmed)
        await reloadStore()
        return true
      } catch {
        return false
      }
    }
    const group = groups.find((g) => g.id === groupId)
    if (!group) return false
    const subs = group.subcategories || []
    if (
      subs.some(
        (s) => s.id !== subcategoryId && s.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      return false
    }

    const nextGroups = groups.map((g) =>
      g.id === groupId
        ? {
            ...g,
            subcategories: (g.subcategories || []).map((s) =>
              s.id === subcategoryId ? { ...s, name: trimmed } : s
            ),
          }
        : g
    )
    setGroups(nextGroups)
    setProducts((prods) =>
      prods.map((p) =>
        p.groupId === groupId && p.subcategoryId === subcategoryId
          ? applyCategoryToProduct(p, nextGroups)
          : p
      )
    )
    const sub = subs.find((s) => s.id === subcategoryId)
    logAudit('subcategory_updated', {
      category: 'category',
      details: `${group.name} → ${sub?.name || subcategoryId} renamed to ${trimmed}`,
    })
    return true
  }, [groups, reloadStore])

  const deleteSubcategory = useCallback(async (groupId, subcategoryId) => {
    if (USE_API) {
      try {
        await removeSubcategory(groupId, subcategoryId)
        await reloadStore()
      } catch {
        // ignore
      }
      return
    }
    const group = groups.find((g) => g.id === groupId)
    const sub = group?.subcategories?.find((s) => s.id === subcategoryId)
    const nextGroups = groups.map((g) =>
      g.id === groupId
        ? { ...g, subcategories: (g.subcategories || []).filter((s) => s.id !== subcategoryId) }
        : g
    )
    setGroups(nextGroups)
    setProducts((prods) =>
      prods.map((p) =>
        p.groupId === groupId && p.subcategoryId === subcategoryId
          ? applyCategoryToProduct({ ...p, subcategoryId: '' }, nextGroups)
          : p
      )
    )
    logAudit('subcategory_deleted', {
      category: 'category',
      details: `${group?.name || groupId} → ${sub?.name || subcategoryId}`,
    })
  }, [groups, reloadStore])

  const deleteGroup = useCallback(async (id) => {
    if (USE_API) {
      try {
        await removeCategory(id)
        await reloadStore()
      } catch {
        // ignore
      }
      return
    }
    const group = groups.find((g) => g.id === id)
    setGroups((prev) => prev.filter((g) => g.id !== id))
    setProducts((prods) =>
      prods.map((p) =>
        p.groupId === id
          ? applyCategoryToProduct({ ...p, groupId: '', subcategoryId: '' }, groups.filter((g) => g.id !== id))
          : p
      )
    )
    logAudit('category_deleted', { category: 'category', details: group?.name || id })
  }, [groups, reloadStore])

  const getProductByBarcode = useCallback(
    (barcode) => products.find((p) => p.barcode === String(barcode).trim()),
    [products]
  )

  const addProduct = useCallback(async (product) => {
    let code = String(product.barcode || '').trim()
    if (!code) {
      code = generateUniqueBarcode(products)
    } else if (isBarcodeTaken(products, code)) {
      return null
    }

    if (USE_API) {
      try {
        const { id } = await createProduct({ ...product, barcode: code })
        await reloadStore()
        return id
      } catch {
        return null
      }
    }

    const id = String(Date.now())
    const normalized = applyBatchesToProduct(
      applyCategoryToProduct(
        {
          ...product,
          barcode: code,
          id,
          groupId: product.groupId || '',
          subcategoryId: product.subcategoryId || '',
          discount: Number(product.discount) || 0,
          hsn: normalizeHsn(product.hsn),
          gst: normalizeGst(product.gst),
          image: product.image || productImageSrc({ ...product, id }),
        },
        groups
      ),
      product.batches || []
    )
    setProducts((prev) => [...prev, normalized])
    logAudit('product_created', {
      category: 'product',
      details: `${normalized.name} (${code})`,
    })
    return id
  }, [groups, products, reloadStore])

  const updateProduct = useCallback(async (id, updates) => {
    const existing = products.find((p) => p.id === id)
    const { barcode: _barcode, name: _name, ...safeUpdates } = updates

    if (USE_API) {
      try {
        await updateProduct(id, safeUpdates)
        await reloadStore()
        return { ok: true }
      } catch (err) {
        return { ok: false, error: err.message || 'Update failed' }
      }
    }

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const nextGroupId = safeUpdates.groupId !== undefined ? safeUpdates.groupId : p.groupId
        const nextSubcategoryId =
          safeUpdates.subcategoryId !== undefined ? safeUpdates.subcategoryId : p.subcategoryId
        const nextDiscount =
          safeUpdates.discount !== undefined ? Math.max(0, Number(safeUpdates.discount) || 0) : p.discount
        const nextHsn = safeUpdates.hsn !== undefined ? normalizeHsn(safeUpdates.hsn) : normalizeHsn(p.hsn)
        const nextGst = safeUpdates.gst !== undefined ? normalizeGst(safeUpdates.gst) : normalizeGst(p.gst)
        let merged = applyCategoryToProduct(
          {
            ...p,
            ...safeUpdates,
            groupId: nextGroupId || '',
            subcategoryId: nextSubcategoryId || '',
            discount: nextDiscount,
            hsn: nextHsn,
            gst: nextGst,
          },
          groups
        )
        if (safeUpdates.batches) {
          merged = applyBatchesToProduct(merged, safeUpdates.batches)
        }
        return merged
      })
    )
    logAudit('product_updated', {
      category: 'product',
      details: existing?.name || id,
    })
    return { ok: true }
  }, [groups, products, reloadStore])

  const deleteProduct = useCallback(async (id) => {
    if (USE_API) {
      try {
        await removeProduct(id)
        await reloadStore()
      } catch {
        // ignore
      }
      return
    }
    const product = products.find((p) => p.id === id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
    logAudit('product_deleted', {
      category: 'product',
      details: product?.name || id,
    })
  }, [products, reloadStore])

  const eraseAllData = useCallback(async () => {
    if (USE_API) {
      try {
        await eraseAll()
        await reloadStore()
      } catch {
        // ignore
      }
      return
    }
    setProducts([])
    setGroups(normalizeGroups(INITIAL_GROUPS))
    setBatches([])
    setOrders([])
    setSettingsState({ ...DEFAULT_SETTINGS })
    logAudit('data_erased', {
      category: 'settings',
      details: 'All products, orders, categories, and settings reset',
    })
  }, [reloadStore])

  const purgeStoreData = useCallback(async (options = {}) => {
    const {
      products: delProducts,
      categories: delCategories,
      batches: delBatches,
      orders: delOrders,
      settings: delSettings,
    } = options

    if (USE_API) {
      try {
        await purge({
          products: Boolean(delProducts),
          categories: Boolean(delCategories),
          batches: Boolean(delBatches),
          orders: Boolean(delOrders),
          settings: Boolean(delSettings),
        })
        await reloadStore()
      } catch {
        // ignore
      }
      return
    }

    if (delProducts) setProducts([])
    if (delOrders) setOrders([])
    if (delCategories) {
      setGroups([])
      setProducts((prev) =>
        prev.map((p) => applyCategoryToProduct({ ...p, groupId: '', subcategoryId: '' }, []))
      )
    }
    if (delBatches) {
      setBatches([])
      setProducts((prev) => prev.map((p) => ({ ...p, batch: '' })))
    }
    if (delSettings) setSettingsState({ ...DEFAULT_SETTINGS })

    const removed = [
      delProducts && 'products',
      delCategories && 'categories',
      delBatches && 'batches',
      delOrders && 'orders',
      delSettings && 'settings',
    ].filter(Boolean)

    if (removed.length > 0) {
      logAudit(removed.length >= 4 ? 'data_erased' : 'data_purged', {
        category: 'settings',
        details: `Removed: ${removed.join(', ')}`,
      })
    }
  }, [reloadStore])

  const addOrder = useCallback(async (order) => {
    if (USE_API) {
      const { id } = await createOrder(order)
      await reloadStore()
      return id
    }

    const id = generateUniqueInvoiceId((candidate) => orders.some((o) => o.id === candidate))
    const newOrder = { ...order, id, date: new Date().toISOString() }
    setOrders((prev) => [newOrder, ...prev])
    setProducts((prev) =>
      prev.map((p) => {
        const lines = (order.items || []).filter((i) => i.barcode === p.barcode)
        if (lines.length === 0) return p

        if (Array.isArray(p.batches) && p.batches.length > 0) {
          let nextBatches = [...p.batches]
          for (const line of lines) {
            const qty = Number(line.qty) || 0
            if (line.productBatchId) {
              nextBatches = nextBatches.map((b) =>
                b.id === line.productBatchId
                  ? { ...b, stock: Math.max(0, Number(b.stock) - qty) }
                  : b
              )
            } else {
              const target = nextBatches.find((b) => Number(b.stock) > 0) || nextBatches[0]
              if (target) {
                nextBatches = nextBatches.map((b) =>
                  b.id === target.id
                    ? { ...b, stock: Math.max(0, Number(b.stock) - qty) }
                    : b
                )
              }
            }
          }
          return applyBatchesToProduct(p, nextBatches)
        }

        const sold = lines.reduce((sum, line) => sum + (Number(line.qty) || 0), 0)
        const stock = Number(p.stock)
        if (!Number.isFinite(stock)) return p
        return { ...p, stock: Math.max(0, stock - sold) }
      })
    )
    logAudit('bill_created', {
      category: 'billing',
      details: `Bill ${id} · ${order.items?.length || 0} items · total ${Number(order.total || 0).toFixed(2)}`,
    })
    return id
  }, [orders, reloadStore])

  const value = {
    products,
    groups,
    batches,
    orders,
    settings,
    setSettings,
    isStoreReady,
    getGroupById,
    getBatchById,
    addGroup,
    updateGroup,
    deleteGroup,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    addBatch,
    deleteBatch,
    getProductByBarcode,
    addProduct,
    updateProduct,
    deleteProduct,
    addOrder,
    eraseAllData,
    purgeStoreData,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
