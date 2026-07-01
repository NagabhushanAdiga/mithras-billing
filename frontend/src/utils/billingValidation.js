export const CUSTOMER_MOBILE_DIGITS = 10

/** Keep only digits, capped at maxLength. */
export function sanitizeDigitsOnly(value, maxLength = CUSTOMER_MOBILE_DIGITS) {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, maxLength)
}

/** Optional mobile — when entered must be a valid 10-digit Indian number. */
export function validateCustomerMobile(value) {
  const digits = sanitizeDigitsOnly(value)
  if (!digits) return null
  if (digits.length !== CUSTOMER_MOBILE_DIGITS) {
    return `Mobile number must be exactly ${CUSTOMER_MOBILE_DIGITS} digits`
  }
  if (!/^[6-9]/.test(digits)) {
    return 'Mobile number must start with 6, 7, 8, or 9'
  }
  return null
}

/** Optional bill discount — validates when a value is entered. */
export function validateBillDiscount(value, type = 'amount', { maxAmount } = {}) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return null

  const n = Number(trimmed)
  if (!Number.isFinite(n)) return 'Enter a valid number'
  if (n < 0) return 'Discount cannot be negative'

  if (type === 'percent') {
    if (n > 100) return 'Discount cannot exceed 100%'
    return null
  }

  if (maxAmount != null && n > maxAmount) {
    return `Discount cannot exceed ${Number(maxAmount).toFixed(2)}`
  }

  return null
}
