import { useEffect, useRef } from 'react'

const SCAN_TERMINATORS = ['Enter', 'Tab']
/** Hardware scanners type much faster than manual keyboard entry. */
const MAX_KEY_GAP_MS = 80

function isFormField(el) {
  if (!el || !(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (tag === 'INPUT') {
    const type = (el.type || 'text').toLowerCase()
    return !['button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'hidden'].includes(type)
  }
  return el.isContentEditable
}

function isBarcodeField(el) {
  return Boolean(el?.closest?.('[data-barcode-input]'))
}

/**
 * Captures USB / Bluetooth barcode scanners (keyboard wedge mode).
 * Works when the scanner "types" into the page even if another element had focus.
 */
export function useHardwareScanner(onScan, { active = true } = {}) {
  const onScanRef = useRef(onScan)
  const bufferRef = useRef('')
  const lastKeyAtRef = useRef(0)

  onScanRef.current = onScan

  useEffect(() => {
    if (!active) {
      bufferRef.current = ''
      return
    }

    const submitBuffer = () => {
      const value = bufferRef.current.trim()
      bufferRef.current = ''
      if (value) onScanRef.current?.(value)
    }

    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return

      const target = e.target
      const inFormField = isFormField(target)
      const inBarcodeField = isBarcodeField(target)

      if (SCAN_TERMINATORS.includes(e.key)) {
        if (inBarcodeField || inFormField) {
          bufferRef.current = ''
          return
        }
        if (bufferRef.current.length > 0) {
          e.preventDefault()
          submitBuffer()
        }
        return
      }

      if (e.key.length !== 1) return

      const now = Date.now()
      if (now - lastKeyAtRef.current > MAX_KEY_GAP_MS) {
        bufferRef.current = ''
      }
      lastKeyAtRef.current = now

      if (inBarcodeField || inFormField) {
        bufferRef.current = ''
        return
      }

      e.preventDefault()
      bufferRef.current += e.key
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [active])
}
