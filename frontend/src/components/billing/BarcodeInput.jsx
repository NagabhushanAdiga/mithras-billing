import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { HiOutlineQrcode } from 'react-icons/hi'
import Input from '../common/Input'

const BarcodeInput = forwardRef(function BarcodeInput(
  {
    onScan,
    onQueryChange,
    onNavigateSuggestions,
    onSelectSuggestion,
    placeholder = 'Scan or enter barcode',
    active = true,
    inputProps = {},
  },
  ref
) {
  const inputRef = useRef(null)

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => {
      if (inputRef.current) inputRef.current.value = ''
      onQueryChange?.('')
    },
  }))

  useEffect(() => {
    if (!active) return
    inputRef.current?.focus()
  }, [active])

  useEffect(() => {
    if (!active) return

    const refocusIfAllowed = (e) => {
      const target = e.target
      if (target?.closest?.('[role="dialog"]')) return
      if (target?.closest?.('[data-pos-suggestions]')) return
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return
      }
      inputRef.current?.focus()
    }

    window.addEventListener('click', refocusIfAllowed)
    return () => window.removeEventListener('click', refocusIfAllowed)
  }, [active])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        if (onNavigateSuggestions?.('down')) {
          e.preventDefault()
          return
        }
      }
      if (e.key === 'ArrowUp') {
        if (onNavigateSuggestions?.('up')) {
          e.preventDefault()
          return
        }
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (onSelectSuggestion?.()) {
          e.preventDefault()
          return
        }
        const value = (el.value || '').trim()
        if (value) {
          e.preventDefault()
          onScan?.(value)
          el.value = ''
          onQueryChange?.('')
        }
      }
    }

    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [onScan, onQueryChange, onNavigateSuggestions, onSelectSuggestion])

  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="text-sm font-bold text-slate-800">Scan or search</label>
        {active && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-700 bg-gradient-to-r from-violet-100 to-fuchsia-100 px-2.5 py-0.5 rounded-full border border-violet-200">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            Ready
          </span>
        )}
      </div>
      <Input
        ref={inputRef}
        icon={HiOutlineQrcode}
        placeholder={placeholder}
        className="barcode-input"
        inputClassName="!py-3.5 !text-base"
        autoFocus={active}
        data-barcode-input
        spellCheck={false}
        onChange={(e) => onQueryChange?.(e.target.value)}
        {...inputProps}
      />
      <p className="text-xs text-slate-400 mt-2">
        Type a name or scan a barcode — use ↑↓ and Enter to pick from suggestions
      </p>
    </div>
  )
})

export default BarcodeInput
