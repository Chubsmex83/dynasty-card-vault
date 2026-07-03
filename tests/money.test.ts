import { describe, it, expect } from 'vitest'
import { mxnToUsd, formatMXN, formatUSD, formatMoney } from '@/lib/money'

describe('mxnToUsd', () => {
  it('applies the FIX divisor and margin, rounded to cents', () => {
    expect(mxnToUsd(100, 20, 0)).toBe(5) // 100 / 20
    expect(mxnToUsd(100, 20, 0.05)).toBe(5.25) // (100 / 20) * 1.05
  })

  it('rounds to the nearest cent', () => {
    // 1748 / 17.4725 = 100.0429..., * 1.05 = 105.045 -> 105.05
    expect(mxnToUsd(1748, 17.4725, 0.05)).toBe(105.05)
  })

  it('returns 0 for an invalid rate instead of Infinity/NaN', () => {
    expect(mxnToUsd(100, 0, 0.05)).toBe(0)
    expect(mxnToUsd(100, NaN, 0.05)).toBe(0)
  })
})

describe('formatMoney', () => {
  it('shows MXN for the Spanish store', () => {
    const out = formatMoney(1500, 'es', 17.4725, 0.05)
    expect(out).toContain('1,500')
    expect(out).not.toContain('.') // no decimals for MXN
  })

  it('shows converted USD (with cents) for the English store', () => {
    const out = formatMoney(2000, 'en', 20, 0.05) // (2000/20)*1.05 = 105.00
    expect(out).toBe(formatUSD(105))
    expect(out).toContain('105.00')
  })
})

describe('formatters', () => {
  it('formatMXN uses the MXN currency style', () => {
    expect(formatMXN(1234)).toContain('1,234')
  })
  it('formatUSD keeps two decimals', () => {
    expect(formatUSD(9.5)).toBe('$9.50')
  })
})
