import { useEffect, useCallback, useRef, useMemo } from 'react'
import Button from '../common/Button'
import Card from '../common/Card'
import { formatQty } from '../../utils/billing'
import { formatBatchDates } from '../../utils/productBatches'
import { usePendingChanges } from '../../hooks/usePendingChanges'

function defaultSelectedId(batches) {
  const firstInStock = batches.find((b) => Number(b.stock) > 0)
  return firstInStock?.id ?? batches[0]?.id ?? null
}

function pickableBatches(batches) {
  return batches.filter((b) => Number(b.stock) > 0)
}

export default function BatchPickModal({ product, batches, currency = '₹', onPick, onClose }) {
  const { pendingChanges, patchPendingChanges } = usePendingChanges({ selectedId: defaultSelectedId(batches) })
  const { selectedId } = pendingChanges
  const enterReadyRef = useRef(false)
  const panelRef = useRef(null)
  const optionRefs = useRef([])

  const available = useMemo(() => pickableBatches(batches), [batches])

  useEffect(() => {
    patchPendingChanges({ selectedId: defaultSelectedId(batches) })
    enterReadyRef.current = false
    const enterTimer = setTimeout(() => {
      enterReadyRef.current = true
    }, 250)
    const focusTimer = setTimeout(() => panelRef.current?.focus(), 50)
    return () => {
      clearTimeout(enterTimer)
      clearTimeout(focusTimer)
    }
  }, [product, batches, patchPendingChanges])

  useEffect(() => {
    const idx = batches.findIndex((b) => b.id === selectedId)
    optionRefs.current[idx]?.scrollIntoView({ block: 'nearest' })
  }, [selectedId, batches])

  const selectedBatch = batches.find((b) => b.id === selectedId) ?? batches[0]
  const canConfirm = selectedBatch && Number(selectedBatch.stock) > 0

  const handleConfirm = useCallback(() => {
    if (selectedBatch && Number(selectedBatch.stock) > 0) onPick(selectedBatch)
  }, [selectedBatch, onPick])

  const moveSelection = useCallback(
    (direction) => {
      if (available.length === 0) return
      const currentIdx = available.findIndex((b) => b.id === selectedId)
      let nextIdx
      if (direction === 'first') {
        nextIdx = 0
      } else if (direction === 'last') {
        nextIdx = available.length - 1
      } else if (currentIdx === -1) {
        nextIdx = 0
      } else {
        nextIdx = (currentIdx + direction + available.length) % available.length
      }
      patchPendingChanges({ selectedId: available[nextIdx].id })
    },
    [available, selectedId, patchPendingChanges]
  )

  useEffect(() => {
    const isTypingField = (el) =>
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
        return
      }

      if (isTypingField(e.target)) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        moveSelection(1)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        moveSelection(-1)
        return
      }
      if (e.key === 'Home') {
        e.preventDefault()
        e.stopPropagation()
        moveSelection('first')
        return
      }
      if (e.key === 'End') {
        e.preventDefault()
        e.stopPropagation()
        moveSelection('last')
        return
      }

      if (e.key === 'Enter' && enterReadyRef.current) {
        e.preventDefault()
        e.stopPropagation()
        if (e.target?.dataset?.batchAction === 'cancel') {
          onClose()
          return
        }
        if (canConfirm) handleConfirm()
      }
    }

    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [handleConfirm, onClose, canConfirm, moveSelection])

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-pick-title"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <div
          ref={panelRef}
          tabIndex={-1}
          className="outline-none focus:ring-2 focus:ring-blue-300 rounded-md"
        >
        <Card className="p-6 max-w-md w-full shadow-2xl">
          <h3 id="batch-pick-title" className="text-lg font-bold text-slate-900 mb-1">
            Choose batch
          </h3>
          <p className="text-sm text-slate-500 mb-1">
            {product.name} has multiple batches — pick one, then add to the bill.
          </p>
          <p className="text-xs text-slate-400 mb-4">
            ↑↓ to select · Enter to add · Esc to cancel
          </p>
          <div
            className="space-y-2 mb-5 max-h-[min(50vh,280px)] overflow-y-auto"
            role="listbox"
            aria-label="Product batches"
            aria-activedescendant={selectedId ? `batch-option-${selectedId}` : undefined}
          >
            {batches.map((batch, index) => {
              const isSelected = batch.id === selectedId
              const outOfStock = Number(batch.stock) <= 0
              const dateLabel = formatBatchDates(batch)
              return (
                <button
                  key={batch.id}
                  id={`batch-option-${batch.id}`}
                  ref={(el) => {
                    optionRefs.current[index] = el
                  }}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={outOfStock}
                  onClick={() => !outOfStock && patchPendingChanges({ selectedId: batch.id })}
                  className={`w-full flex items-center justify-between gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                    outOfStock
                      ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                      : isSelected
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 cursor-pointer'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="font-semibold text-slate-800 block">{batch.name}</span>
                    {dateLabel ? (
                      <span className="text-xs text-slate-500 block mt-0.5">{dateLabel}</span>
                    ) : null}
                  </span>
                  <span className="text-sm text-slate-600 shrink-0 text-right">
                    {outOfStock
                      ? 'Out of stock'
                      : `${currency}${Number(batch.price ?? batch.sellingPrice).toFixed(2)} · ${formatQty(batch.stock)} left`}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-batch-action="cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1"
              disabled={!canConfirm}
              data-batch-action="confirm"
            >
              Add to bill
            </Button>
          </div>
        </Card>
        </div>
      </div>
    </div>
  )
}
