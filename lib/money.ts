import type { Locale } from '@/i18n/config'

/**
 * Money helpers (Phase 2). Pure and client-safe — no secrets, no I/O.
 *
 * Prices are stored in MXN (the reference currency). The English store shows
 * USD derived from the daily Banxico FIX rate (see lib/fx/banxico.ts). The FIX
 * rate and margin are fetched on the server and passed in, so these functions
 * work identically on the server and the client (e.g. the client-side cart).
 */

/** Convert an MXN amount to USD: (mxn / fix) * (1 + margin), rounded to cents. */
export function mxnToUsd(mxn: number, fix: number, margin: number): number {
  if (!Number.isFinite(fix) || fix <= 0) return 0
  const usd = (mxn / fix) * (1 + margin)
  return Math.round(usd * 100) / 100
}

/** Format an MXN amount as pesos (clean, no decimals for the premium look). */
export function formatMXN(mxn: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(mxn)
}

/** Format a USD amount to the cent, per spec. */
export function formatUSD(usd: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usd)
}

/**
 * Format an MXN base price for display in the given locale:
 * es → MXN as-is; en → USD converted from the FIX rate + margin.
 */
export function formatMoney(
  mxn: number,
  locale: Locale,
  fix: number,
  margin: number
): string {
  return locale === 'en' ? formatUSD(mxnToUsd(mxn, fix, margin)) : formatMXN(mxn)
}
