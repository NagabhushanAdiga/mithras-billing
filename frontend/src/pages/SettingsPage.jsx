import { useMemo, useEffect, useState } from 'react'
import {
  HiOutlineCog,
  HiOutlineOfficeBuilding,
  HiOutlineCurrencyDollar,
  HiOutlineTag,
  HiOutlineCube,
  HiOutlineKey,
  HiOutlineExclamation,
  HiOutlineDownload,
} from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import PageHeader from '../components/common/PageHeader'
import Pagination from '../components/common/Pagination'
import TableIdentityCell from '../components/common/TableIdentityCell'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { isAdminRole } from '../utils/roles'
import { useToast } from '../context/ToastContext'
import { useAudit } from '../context/AuditContext'
import { logAudit } from '../utils/auditLog'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { usePagination } from '../hooks/usePagination'
import { usePendingChanges } from '../hooks/usePendingChanges'
import { formatProductDiscount, clampDiscount, discountBasePrice } from '../utils/billing'
import { formatBatchSummary } from '../utils/productBatches'
import { useSupport } from '../Support/SupportContext'
import { USE_API } from '../api/client'
import { clear as clearAudit } from '../api/services/auditService'
import { STORE_EXPORT_HANDLERS } from '../utils/exportStoreData'

const PURGE_OPTIONS = [
  {
    key: 'products',
    label: 'Products',
    description: 'All inventory items and barcodes',
    exportLabel: 'Export products',
  },
  {
    key: 'categories',
    label: 'Categories & subcategories',
    description: 'Group and subcategory catalog',
    exportLabel: 'Export categories',
  },
  {
    key: 'batches',
    label: 'Batch catalog',
    description: 'Named batches used across products',
    exportLabel: 'Export batches',
  },
  {
    key: 'orders',
    label: 'Bills & orders',
    description: 'Sales history and invoices',
    exportLabel: 'Export bills',
  },
  {
    key: 'supportTickets',
    label: 'Support tickets',
    description: 'Customer support requests',
    exportLabel: 'Export tickets',
  },
  {
    key: 'auditLog',
    label: 'Audit log',
    description: 'Activity history entries',
    exportLabel: 'Export audit log',
  },
  {
    key: 'settings',
    label: 'Store settings',
    description: 'Reset profile, tax, and billing defaults',
    exportLabel: 'Export settings',
  },
]

const EMPTY_PURGE_SELECTION = Object.fromEntries(PURGE_OPTIONS.map((o) => [o.key, false]))

const CURRENCIES = [
  { value: '₹', label: 'INR (₹)' },
  { value: '$', label: 'USD ($)' },
  { value: '€', label: 'EUR (€)' },
]

function buildSettingsFormState(settings) {
  return {
    storeName: settings?.storeName ?? '',
    storeAddress: settings?.storeAddress ?? '',
    storeGstin: settings?.storeGstin ?? '',
    storeWebsite: settings?.storeWebsite ?? '',
    taxRate: String(settings?.taxRate ?? 5),
    currency: settings?.currency ?? '₹',
    discountEnabled: settings?.discountEnabled ?? true,
    discountType: settings?.discountType ?? 'percent',
    maxDiscountPercent: String(settings?.maxDiscountPercent ?? 50),
    billDiscountEnabled: settings?.billDiscountEnabled ?? false,
  }
}

function SettingsSection({ icon: Icon, iconClassName, title, description, children, className = '' }) {
  return (
    <Card className={`p-5 sm:p-6 !overflow-visible h-full ${className}`}>
      <div className="flex items-start gap-3 sm:gap-4 mb-5 pb-4 border-b border-slate-200">
        <div
          className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br ${iconClassName} flex items-center justify-center text-white`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">{title}</h2>
          {description && (
            <p className="text-slate-500 text-sm mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      {children}
    </Card>
  )
}

export default function SettingsPage() {
  const {
    settings,
    setSettings,
    products,
    groups,
    batches,
    orders,
    updateProduct,
    eraseAllData,
    purgeStoreData,
  } = useStore()
  const { user, changePassword, verifyPassword } = useAuth()
  const { tickets, clearAllTickets } = useSupport()
  const { entries, clearAuditLog } = useAudit()
  const { showToast } = useToast()
  const { loading: saving, run: runSave } = useAsyncAction()
  const { loading: applyingDiscount, run: runApplyDiscount } = useAsyncAction()
  const { loading: changingPassword, run: runChangePassword } = useAsyncAction()
  const { loading: erasingData, run: runEraseData } = useAsyncAction()
  const { loading: purgingData, run: runPurgeData } = useAsyncAction()
  const [exportingKey, setExportingKey] = useState(null)
  const { pendingChanges, setPendingChanges, patchPendingChanges } = usePendingChanges({
    ...buildSettingsFormState(settings),
    selectedProductId: '',
    productDiscount: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showEraseDialog: false,
    erasePassword: '',
    erasePasswordError: '',
    purgeSelection: EMPTY_PURGE_SELECTION,
    showPurgeDialog: false,
    purgePassword: '',
    purgePasswordError: '',
  })
  const {
    storeName,
    storeAddress,
    storeGstin,
    storeWebsite,
    taxRate,
    currency,
    discountEnabled,
    discountType,
    maxDiscountPercent,
    billDiscountEnabled,
    selectedProductId,
    productDiscount,
    currentPassword,
    newPassword,
    confirmPassword,
    showEraseDialog,
    erasePassword,
    erasePasswordError,
    purgeSelection,
    showPurgeDialog,
    purgePassword,
    purgePasswordError,
  } = pendingChanges

  const purgeCounts = useMemo(
    () => ({
      products: products.length,
      categories: groups.length,
      batches: batches.length,
      orders: orders.length,
      supportTickets: tickets.length,
      auditLog: entries.length,
      settings: 1,
    }),
    [products.length, groups.length, batches.length, orders.length, tickets.length, entries.length]
  )

  const selectedPurgeKeys = useMemo(
    () => PURGE_OPTIONS.filter((o) => purgeSelection[o.key]).map((o) => o.key),
    [purgeSelection]
  )

  const hasPurgeSelection = selectedPurgeKeys.length > 0

  const isAdmin = isAdminRole(user?.role)

  useEffect(() => {
    patchPendingChanges(buildSettingsFormState(settings))
  }, [settings, patchPendingChanges])

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  )

  const productsWithDiscount = useMemo(
    () => products.filter((p) => Number(p.discount) > 0),
    [products]
  )

  const discountListPagination = usePagination(productsWithDiscount)

  const activeDiscountType = discountType
  const activeMaxDiscountPercent = parseFloat(maxDiscountPercent) || 50
  const posDiscountsSavedOff = settings?.discountEnabled === false

  useEffect(() => {
    if (!selectedProduct) {
      patchPendingChanges({ productDiscount: '' })
      return
    }
    const d = Number(selectedProduct.discount) || 0
    patchPendingChanges({ productDiscount: d > 0 ? String(d) : '' })
  }, [selectedProduct, patchPendingChanges])

  const handleSave = async (e) => {
    e.preventDefault()
    const tax = parseFloat(taxRate)
    if (isNaN(tax) || tax < 0) {
      showToast('Please enter a valid tax rate', 'error')
      return
    }
    const maxPct = parseFloat(maxDiscountPercent)
    if (discountType === 'percent' && (isNaN(maxPct) || maxPct < 0 || maxPct > 100)) {
      showToast('Max discount must be between 0 and 100', 'error')
      return
    }
    const gstin = storeGstin.trim().toUpperCase()
    if (gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) {
      showToast('Please enter a valid 15-character GSTIN', 'error')
      return
    }
    const website = storeWebsite.trim()
    if (website && !/^https?:\/\/.+/i.test(website) && !/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(website)) {
      showToast('Please enter a valid website URL', 'error')
      return
    }
    const normalizedWebsite =
      !website ? '' : /^https?:\/\//i.test(website) ? website : `https://${website}`

    await runSave(async () => {
      setSettings({
        storeName: storeName.trim() || 'SuperMart Billing',
        storeAddress: storeAddress.trim(),
        storeGstin: gstin,
        storeWebsite: normalizedWebsite,
        taxRate: tax,
        currency,
        discountEnabled,
        discountType,
        maxDiscountPercent: discountType === 'percent' ? maxPct : settings?.maxDiscountPercent ?? 50,
        billDiscountEnabled,
      })
      logAudit('settings_updated', {
        category: 'settings',
        details: `Store: ${storeName.trim() || 'SuperMart Billing'} · tax ${tax}%`,
      })
      showToast('Settings saved successfully')
    })
  }

  const handleApplyProductDiscount = async () => {
    if (!selectedProductId || !selectedProduct) {
      showToast('Please select a product', 'error')
      return
    }
    const raw = productDiscount.trim()
    const val = raw === '' ? 0 : parseFloat(raw)
    if (raw !== '' && (isNaN(val) || val < 0)) {
      showToast('Please enter a valid discount value', 'error')
      return
    }
    if (activeDiscountType === 'percent' && val > 100) {
      showToast('Percentage discount cannot exceed 100', 'error')
      return
    }

    const clamped = clampDiscount(val, activeDiscountType, selectedProduct, activeMaxDiscountPercent)
    if (val > 0 && clamped < val) {
      const capLabel =
        activeDiscountType === 'percent'
          ? `${activeMaxDiscountPercent}%`
          : `${currency}${discountBasePrice(selectedProduct).toFixed(2)} per unit (MRP)`
      showToast(`Discount capped to ${capLabel}`, 'info')
    }

    await runApplyDiscount(async () => {
      const result = await updateProduct(selectedProductId, { discount: clamped })
      if (!result?.ok) {
        showToast(result?.error || 'Could not update product discount', 'error')
        return
      }
      patchPendingChanges({ productDiscount: clamped > 0 ? String(clamped) : '' })
      showToast(
        clamped > 0
          ? `Discount set to ${formatProductDiscount(clamped, activeDiscountType, currency)}`
          : 'Product discount removed'
      )
    })
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!newPassword.trim()) {
      showToast('Enter a new password', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error')
      return
    }
    await runChangePassword(async () => {
      const result = await changePassword({
        currentPassword,
        newPassword,
      })
      if (!result.ok) {
        showToast(result.error || 'Could not update password', 'error')
        return
      }
      patchPendingChanges({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      showToast('Password updated successfully')
    })
  }

  const selectedBatchName = selectedProduct
    ? formatBatchSummary(selectedProduct)
    : null

  const openEraseDialog = () => {
    patchPendingChanges({
      erasePassword: '',
      erasePasswordError: '',
      showEraseDialog: true,
    })
  }

  const closeEraseDialog = () => {
    if (erasingData) return
    patchPendingChanges({
      showEraseDialog: false,
      erasePassword: '',
      erasePasswordError: '',
    })
  }

  const togglePurgeOption = (key) => {
    setPendingChanges((prev) => ({
      ...prev,
      purgeSelection: { ...prev.purgeSelection, [key]: !prev.purgeSelection[key] },
    }))
  }

  const openPurgeDialog = () => {
    if (!hasPurgeSelection) return
    patchPendingChanges({
      purgePassword: '',
      purgePasswordError: '',
      showPurgeDialog: true,
    })
  }

  const closePurgeDialog = () => {
    if (purgingData) return
    patchPendingChanges({
      showPurgeDialog: false,
      purgePassword: '',
      purgePasswordError: '',
    })
  }

  const runPurge = async (keys) => {
    const hasStorePurge =
      keys.includes('products') ||
      keys.includes('categories') ||
      keys.includes('batches') ||
      keys.includes('orders') ||
      keys.includes('settings')

    if (hasStorePurge) {
      await purgeStoreData({
        products: keys.includes('products'),
        categories: keys.includes('categories'),
        batches: keys.includes('batches'),
        orders: keys.includes('orders'),
        settings: keys.includes('settings'),
      })
    }
    if (keys.includes('supportTickets')) {
      clearAllTickets()
    }
    if (keys.includes('auditLog')) {
      if (USE_API) {
        try {
          await clearAudit()
        } catch {
          // ignore
        }
      }
      clearAuditLog()
    }
  }

  const handlePurgeSelected = async () => {
    if (!purgePassword) {
      patchPendingChanges({ purgePasswordError: 'Enter your admin password to continue' })
      return
    }
    if (!(await verifyPassword(purgePassword))) {
      patchPendingChanges({ purgePasswordError: 'Incorrect password' })
      return
    }

    const keys = [...selectedPurgeKeys]
    runPurgeData(async () => {
      await runPurge(keys)
      patchPendingChanges({
        purgeSelection: EMPTY_PURGE_SELECTION,
        selectedProductId: '',
        productDiscount: '',
      })
      closePurgeDialog()
      showToast('Selected data has been deleted', 'info')
    })
  }

  const storeMeta = useMemo(
    () => ({
      storeName: settings?.storeName,
      storeAddress: settings?.storeAddress,
      storeGstin: settings?.storeGstin,
      storeWebsite: settings?.storeWebsite,
    }),
    [settings]
  )

  const exportDataByKey = {
    products,
    categories: groups,
    batches,
    orders,
    supportTickets: tickets,
    auditLog: entries,
    settings,
  }

  const handleExport = async (key) => {
    const option = PURGE_OPTIONS.find((o) => o.key === key)
    const exporter = STORE_EXPORT_HANDLERS[key]
    if (!exporter) return

    setExportingKey(key)
    try {
      const data = exportDataByKey[key]
      const filename = exporter(data, storeMeta)
      logAudit('data_exported', {
        category: 'settings',
        details: `${option?.label || key} → ${filename}`,
      })
      showToast(`Exported ${option?.label?.toLowerCase() || 'data'} to Excel`)
    } catch (err) {
      showToast(err.message || 'Could not export data', 'error')
    } finally {
      setExportingKey(null)
    }
  }

  const handleEraseAllData = async () => {
    if (!erasePassword) {
      patchPendingChanges({ erasePasswordError: 'Enter your admin password to continue' })
      return
    }
    if (!(await verifyPassword(erasePassword))) {
      patchPendingChanges({ erasePasswordError: 'Incorrect password' })
      return
    }

    runEraseData(async () => {
      await eraseAllData()
      clearAllTickets()
      if (USE_API) {
        try {
          await clearAudit()
        } catch {
          // ignore
        }
      }
      clearAuditLog()
      patchPendingChanges({
        selectedProductId: '',
        productDiscount: '',
        purgeSelection: EMPTY_PURGE_SELECTION,
        showEraseDialog: false,
        erasePassword: '',
        erasePasswordError: '',
      })
      showToast('All store data has been erased', 'info')
    })
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-8">
      <PageHeader
        icon={HiOutlineCog}
        iconClassName="from-slate-600 to-slate-800"
        title="Settings"
        description="Manage your store profile, billing rules, and POS discounts."
      />

      <form id="settings-form" onSubmit={handleSave} className="flex flex-col gap-6 sm:gap-8" autoComplete="off">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SettingsSection
            icon={HiOutlineOfficeBuilding}
            iconClassName="from-violet-500 to-fuchsia-600"
            title="Store profile"
            description="Business details shown in the header and on printed bills."
            className="lg:col-span-2"
          >
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
              <Input
                label="Store name"
                value={storeName}
                onChange={(e) => patchPendingChanges({ storeName: e.target.value })}
                placeholder="SuperMart Billing"
                className="sm:col-span-2"
              />
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Address <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <p className="text-xs text-slate-400 mb-1.5">Full supermarket address for invoices</p>
                <textarea
                  value={storeAddress}
                  onChange={(e) => patchPendingChanges({ storeAddress: e.target.value })}
                  placeholder="Shop no., street, city, state, PIN"
                  rows={3}
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  className="field-input resize-y min-h-[88px] w-full"
                />
              </div>
              <Input
                label="GSTIN"
                hint="15-character GST number (optional)"
                value={storeGstin}
                onChange={(e) => patchPendingChanges({ storeGstin: e.target.value.toUpperCase() })}
                placeholder="22AAAAA0000A1Z5"
                inputClassName="!font-mono !uppercase"
                maxLength={15}
              />
              <Input
                label="Website"
                hint="Optional — shown on printed bills"
                type="url"
                value={storeWebsite}
                onChange={(e) => patchPendingChanges({ storeWebsite: e.target.value })}
                placeholder="www.yourstore.com"
                className="sm:col-span-2"
              />
            </div>
          </SettingsSection>

          <SettingsSection
            icon={HiOutlineCurrencyDollar}
            iconClassName="from-emerald-500 to-teal-600"
            title="Tax & currency"
            description="How tax is calculated and how amounts are displayed."
          >
            <div className="space-y-4 sm:space-y-5">
              <Input
                label="Tax rate (%)"
                hint="Applied on each item's discounted amount (per line)"
                type="number"
                step="0.01"
                min="0"
                value={taxRate}
                onChange={(e) => patchPendingChanges({ taxRate: e.target.value })}
                placeholder="5"
              />
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Currency</label>
                <p className="text-xs text-slate-400 mb-1.5">Used across POS, products, and reports</p>
                <select
                  value={currency}
                  onChange={(e) => patchPendingChanges({ currency: e.target.value })}
                  className="field-select"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </SettingsSection>
        </div>

        <SettingsSection
          icon={HiOutlineTag}
          iconClassName="from-amber-500 to-orange-600"
          title="POS discount rules"
          description="Control whether item discounts apply at checkout and how they work."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg bg-slate-50 border border-slate-200 md:col-span-2">
              <input
                type="checkbox"
                checked={discountEnabled}
                onChange={(e) => patchPendingChanges({ discountEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-sm font-semibold text-slate-700">Enable per-item discounts on POS</span>
            </label>

            {discountEnabled && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Discount type</label>
                  <p className="text-xs text-slate-400 mb-1.5">Percent or amount off each unit&apos;s MRP</p>
                  <select
                    value={discountType}
                    onChange={(e) => patchPendingChanges({ discountType: e.target.value })}
                    className="field-select"
                  >
                    <option value="percent">Percentage off line (%)</option>
                    <option value="amount">Flat amount per unit ({currency})</option>
                  </select>
                </div>
                {discountType === 'percent' && (
                  <Input
                    label="Maximum discount (%)"
                    hint="Cap for product-level percent discounts"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={maxDiscountPercent}
                    onChange={(e) => patchPendingChanges({ maxDiscountPercent: e.target.value })}
                    placeholder="50"
                  />
                )}
              </>
            )}

            {isAdmin && (
              <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg bg-amber-50/80 border border-amber-200 md:col-span-2">
                <input
                  type="checkbox"
                  checked={billDiscountEnabled}
                  onChange={(e) => patchPendingChanges({ billDiscountEnabled: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700">
                  <span className="font-semibold block">Allow extra bill discount on POS</span>
                  <span className="text-xs text-slate-500 mt-0.5 block">
                    When enabled, cashiers can apply an optional discount on the final bill total at checkout.
                  </span>
                </span>
              </label>
            )}
          </div>
        </SettingsSection>

        <SettingsSection
          icon={HiOutlineCube}
          iconClassName="from-sky-500 to-indigo-600"
          title="Product discounts"
          description="Set per-product discount — calculated on MRP and applied automatically at POS."
        >
            {posDiscountsSavedOff && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-4 py-3 mb-4">
                POS discounts are currently <strong>off</strong>. Enable them above and click <strong>Save settings</strong> for discounts to apply at checkout. You can still assign product discounts below.
              </p>
            )}

            {!discountEnabled && !posDiscountsSavedOff && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-4 py-3 mb-4">
                POS discounts are unchecked above — save settings after enabling to apply at checkout.
              </p>
            )}

            {products.length === 0 ? (
              <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-4 py-6 text-center">
                No products yet. Add products first, then set discounts here.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-end">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Product</label>
                  <p className="text-xs text-slate-400 mb-1.5">
                    Discount type: {activeDiscountType === 'percent' ? 'percentage' : `flat ${currency} per unit`}
                  </p>
                  <select
                    value={selectedProductId}
                    onChange={(e) => patchPendingChanges({ selectedProductId: e.target.value })}
                    className="field-select"
                  >
                    <option value="">Select a product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.barcode})
                        {Number(p.discount) > 0
                          ? ` — ${formatProductDiscount(p.discount, activeDiscountType, currency)}`
                          : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label={`Discount (${activeDiscountType === 'percent' ? '%' : `${currency} / unit`})`}
                  hint={
                    activeDiscountType === 'percent'
                      ? `Max ${activeMaxDiscountPercent}%`
                      : `Max ${currency}${selectedProduct ? Number(selectedProduct.price).toFixed(2) : '0.00'} per unit`
                  }
                  type="number"
                  min="0"
                  max={
                    activeDiscountType === 'percent'
                      ? String(activeMaxDiscountPercent)
                      : selectedProduct
                        ? String(selectedProduct.price)
                        : undefined
                  }
                  step={activeDiscountType === 'percent' ? '1' : '0.01'}
                  value={productDiscount}
                  onChange={(e) => patchPendingChanges({ productDiscount: e.target.value })}
                  placeholder="0"
                />
                <div className="sm:col-span-2 lg:col-span-1 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    loading={applyingDiscount}
                    className="w-full sm:w-auto"
                    onClick={handleApplyProductDiscount}
                  >
                    Apply to product
                  </Button>
                  {selectedProductId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        patchPendingChanges({ productDiscount: '' })
                        const result = await updateProduct(selectedProductId, { discount: 0 })
                        if (!result?.ok) {
                          showToast(result?.error || 'Could not clear product discount', 'error')
                          return
                        }
                        showToast('Product discount removed')
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            )}

            {selectedProduct && (
              <div className="mt-5 p-4 rounded-md bg-violet-50/50 border border-violet-100 text-sm">
                <p className="font-semibold text-slate-800">{selectedProduct.name}</p>
                <p className="text-slate-500 text-xs mt-1 font-mono">{selectedProduct.barcode}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-600">
                  <span>
                    Price:{' '}
                    <strong className="text-slate-800">
                      {currency}{Number(selectedProduct.price).toFixed(2)}
                    </strong>
                  </span>
                  {selectedBatchName && selectedBatchName !== '—' && (
                    <span>
                      Batch: <strong className="text-teal-700">{selectedBatchName}</strong>
                    </span>
                  )}
                  <span>
                    Current discount:{' '}
                    <strong className="text-violet-700">
                      {formatProductDiscount(selectedProduct.discount, activeDiscountType, currency)}
                    </strong>
                  </span>
                </div>
              </div>
            )}

            {productsWithDiscount.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-sm font-bold text-slate-800 mb-3">Products with active discounts</p>
                <ul className="rounded-md border border-slate-200 overflow-hidden">
                  {discountListPagination.paginatedItems.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm bg-white border-b border-slate-300 last:border-b-0 hover:bg-violet-50/50 cursor-pointer"
                      onClick={() => patchPendingChanges({ selectedProductId: p.id })}
                    >
                      <TableIdentityCell product={p} title={p.name} className="flex-1 min-w-0" />
                      <span className="text-violet-700 font-bold shrink-0">
                        {formatProductDiscount(p.discount, activeDiscountType, currency)}
                      </span>
                    </li>
                  ))}
                </ul>
                <Pagination
                  page={discountListPagination.page}
                  totalPages={discountListPagination.totalPages}
                  totalItems={discountListPagination.totalItems}
                  startIndex={discountListPagination.startIndex}
                  endIndex={discountListPagination.endIndex}
                  onPageChange={discountListPagination.setPage}
                />
              </div>
            )}
          </SettingsSection>

        <div className="flex justify-end pt-2 border-t border-slate-200">
          <Button type="submit" loading={saving} className="min-w-[160px]">
            Save settings
          </Button>
        </div>
      </form>

      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SettingsSection
            icon={HiOutlineKey}
            iconClassName="from-rose-500 to-pink-600"
            title="Account security"
            description="Change your admin login password. You will use the new password on next sign-in."
          >
            <form onSubmit={handleChangePassword} className="grid sm:grid-cols-2 gap-4 sm:gap-5" autoComplete="off">
              <Input
                label="Current password"
                type="password"
                value={currentPassword}
                onChange={(e) => patchPendingChanges({ currentPassword: e.target.value })}
                required
                className="sm:col-span-2"
              />
              <Input
                label="New password"
                type="password"
                hint="At least 4 characters"
                value={newPassword}
                onChange={(e) => patchPendingChanges({ newPassword: e.target.value })}
                required
              />
              <Input
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={(e) => patchPendingChanges({ confirmPassword: e.target.value })}
                required
              />
              <div className="sm:col-span-2 pt-1">
                <Button type="submit" loading={changingPassword} className="w-full sm:w-auto">
                  Update password
                </Button>
              </div>
            </form>
          </SettingsSection>

          <SettingsSection
            icon={HiOutlineExclamation}
            iconClassName="from-red-500 to-orange-600"
            title="Data export & danger zone"
            description="Download a backup as Excel before deleting. Team login accounts are always kept."
            className="lg:col-span-2"
          >
            <div className="space-y-5">
              <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 sm:p-5">
                <p className="text-sm text-red-900 font-semibold mb-1">Export or delete specific content</p>
                <p className="text-sm text-red-800/90 leading-relaxed mb-4">
                  Export any section to Excel individually, or select items to delete permanently with your admin password.
                </p>
                <ul className="space-y-2 mb-4">
                  {PURGE_OPTIONS.map((option) => {
                    const count = purgeCounts[option.key]
                    const countLabel =
                      option.key === 'settings'
                        ? 'Will reset to defaults'
                        : `${count} ${count === 1 ? 'item' : 'items'}`
                    const canExport = option.key === 'settings' || count > 0
                    const isExporting = exportingKey === option.key
                    return (
                      <li key={option.key}>
                        <div className="flex flex-col sm:flex-row sm:items-stretch gap-2 rounded-lg border border-red-100 bg-white/80 overflow-hidden">
                          <label className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-white transition-colors flex-1 min-w-0">
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                              checked={Boolean(purgeSelection[option.key])}
                              onChange={() => togglePurgeOption(option.key)}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <span className="text-sm font-medium text-slate-900">{option.label}</span>
                                <span className="text-xs text-slate-500">{countLabel}</span>
                              </span>
                              <span className="block text-xs text-slate-500 mt-0.5">{option.description}</span>
                            </span>
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            className="shrink-0 rounded-none sm:rounded-none sm:border-l sm:border-t-0 border-t border-red-100 px-4"
                            onClick={() => handleExport(option.key)}
                            loading={isExporting}
                            disabled={!canExport || (exportingKey && !isExporting)}
                          >
                            <HiOutlineDownload className="w-4 h-4" aria-hidden="true" />
                            {option.exportLabel}
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <Button
                  type="button"
                  variant="danger"
                  onClick={openPurgeDialog}
                  disabled={!hasPurgeSelection}
                  className="w-full sm:w-auto"
                >
                  Delete selected…
                </Button>
              </div>

              <div className="rounded-lg border-2 border-red-200 bg-red-50/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-red-900 font-semibold mb-1">Erase all store data</p>
                  <p className="text-sm text-red-800/90 leading-relaxed">
                    Removes everything above in one step and resets settings. Support tickets and audit log included.
                  </p>
                </div>
                <Button type="button" variant="danger" onClick={openEraseDialog} className="w-full sm:w-auto shrink-0">
                  Erase all data…
                </Button>
              </div>
            </div>
          </SettingsSection>
        </div>
      )}

      {showPurgeDialog && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="purge-data-title"
        >
          <Card className="p-6 max-w-md w-full shadow-2xl border-2 border-red-200">
            <h3 id="purge-data-title" className="text-lg font-bold text-red-900 mb-2">
              Delete selected data?
            </h3>
            <p className="text-slate-600 text-sm mb-3 leading-relaxed">
              The following will be permanently removed:
            </p>
            <ul className="text-sm text-slate-700 mb-4 list-disc list-inside space-y-0.5">
              {PURGE_OPTIONS.filter((o) => purgeSelection[o.key]).map((o) => (
                <li key={o.key}>{o.label}</li>
              ))}
            </ul>
            <Input
              label="Admin password"
              type="password"
              value={purgePassword}
              onChange={(e) => patchPendingChanges({ purgePassword: e.target.value, purgePasswordError: '' })}
              error={purgePasswordError}
              placeholder="Enter your password to confirm"
            />
            <div className="flex gap-2 justify-end mt-5">
              <Button variant="outline" onClick={closePurgeDialog} disabled={purgingData}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handlePurgeSelected} loading={purgingData}>
                Delete selected
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showEraseDialog && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="erase-data-title"
        >
          <Card className="p-6 max-w-md w-full shadow-2xl border-2 border-red-200">
            <h3 id="erase-data-title" className="text-lg font-bold text-red-900 mb-2">
              Erase all store data?
            </h3>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              All products, categories, batches, bills, support tickets, and audit log will be
              permanently deleted. Store settings will reset to defaults. Team logins are kept.
            </p>
            <Input
              label="Admin password"
              type="password"
              value={erasePassword}
              onChange={(e) => patchPendingChanges({ erasePassword: e.target.value, erasePasswordError: '' })}
              error={erasePasswordError}
              placeholder="Enter your password to confirm"
            />
            <div className="flex gap-2 justify-end mt-5">
              <Button variant="outline" onClick={closeEraseDialog} disabled={erasingData}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleEraseAllData} loading={erasingData}>
                Erase everything
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
