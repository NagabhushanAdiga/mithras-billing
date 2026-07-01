import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi'
import Button from '../common/Button'
import Input from '../common/Input'
import { emptyBatchRow } from '../../utils/productBatches'

export default function ProductBatchesEditor({
  rows,
  onChange,
  errors = {},
  currency = '₹',
}) {
  const updateRow = (id, field, value) => {
    onChange(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const removeRow = (id) => {
    if (rows.length <= 1) return
    onChange(rows.filter((row) => row.id !== id))
  }

  const addRow = () => {
    const nextIndex = rows.length + 1
    onChange([...rows, emptyBatchRow({ name: `batch ${nextIndex}` })])
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <label className="block text-sm font-semibold text-slate-700">Batches</label>
          <p className="text-xs text-slate-400 mt-0.5">
            MRP, cost, selling price, quantity, manufactured date, expiry, and FSSAI per batch
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addRow}
          className="w-full sm:w-auto shrink-0 !py-2"
        >
          <HiOutlinePlus className="w-4 h-4 mr-1" />
          Add batch
        </Button>
      </div>

      {errors.batches ? (
        <p className="text-sm text-red-600">{errors.batches}</p>
      ) : null}

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Batch {index + 1}
              </span>
              {rows.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 cursor-pointer"
                >
                  <HiOutlineTrash className="w-3.5 h-3.5" />
                  Remove
                </button>
              ) : null}
            </div>

            <Input
              label="Batch name"
              value={row.name}
              onChange={(e) => updateRow(row.id, 'name', e.target.value)}
              placeholder="e.g. batch 1"
              error={errors[`batch-${row.id}-name`]}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <Input
                label={`MRP (${currency})`}
                type="number"
                step="0.01"
                min="0"
                value={row.mrp}
                onChange={(e) => updateRow(row.id, 'mrp', e.target.value)}
                placeholder="0.00"
                error={errors[`batch-${row.id}-mrp`]}
              />
              <Input
                label={`Cost price (${currency})`}
                type="number"
                step="0.01"
                min="0"
                value={row.costPrice}
                onChange={(e) => updateRow(row.id, 'costPrice', e.target.value)}
                placeholder="0.00"
                error={errors[`batch-${row.id}-costPrice`]}
              />
              <Input
                label={`Selling price (${currency})`}
                type="number"
                step="0.01"
                min="0"
                value={row.sellingPrice}
                onChange={(e) => updateRow(row.id, 'sellingPrice', e.target.value)}
                placeholder="0.00"
                error={errors[`batch-${row.id}-sellingPrice`]}
                required
              />
              <Input
                label="Quantity"
                type="number"
                min="0"
                step="1"
                value={row.stock}
                onChange={(e) => updateRow(row.id, 'stock', e.target.value)}
                placeholder="0"
                error={errors[`batch-${row.id}-stock`]}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Manufactured date"
                type="date"
                value={row.manufacturedDate}
                onChange={(e) => updateRow(row.id, 'manufacturedDate', e.target.value)}
                error={errors[`batch-${row.id}-manufacturedDate`]}
              />
              <Input
                label="Expiry date"
                value={row.expiryDate}
                onChange={(e) => updateRow(row.id, 'expiryDate', e.target.value)}
                placeholder="e.g. 12/2026 or Best before Mar 2027"
                error={errors[`batch-${row.id}-expiryDate`]}
              />
              <Input
                label="FSSAI"
                value={row.fssai}
                onChange={(e) => updateRow(row.id, 'fssai', e.target.value)}
                placeholder="e.g. 12345678901234"
                error={errors[`batch-${row.id}-fssai`]}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
