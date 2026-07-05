import type { Locale } from '@/i18n/config'
import { getProductById, getSpotById } from '@/lib/data'
import { mxnToUsd } from '@/lib/money'

/**
 * Checkout charge resolver (Phase 3). Pure and server-safe — no I/O, no secrets.
 *
 * The single source of truth for what gets charged. The client sends only ids +
 * quantities; this function looks up the authoritative base price from the
 * catalog and returns the amount and currency for the given locale. Feeding both
 * the displayed quote and the amount sent to the gateway through this one
 * function guarantees the shown price equals the charged price.
 *
 * Interim: the catalog's numeric `price` is treated as the MXN base price until
 * the client's final MXN price list lands (then only the base-price read below
 * changes).
 */

export type CartLine = { id: string; kind: 'product' | 'spot'; qty: number }
export type ChargeLineItem = {
  id: string
  name: string
  unitAmount: number
  qty: number
}
export type ResolvedCharge = {
  currency: 'MXN' | 'USD'
  lineItems: ChargeLineItem[]
  total: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

function basePrice(item: CartLine): { name: string; mxn: number } {
  if (item.kind === 'product') {
    const p = getProductById(item.id)
    if (!p) throw new Error(`Unknown cart item: ${item.id}`)
    return { name: p.name, mxn: p.price }
  }
  const spot = getSpotById(item.id)
  if (!spot) throw new Error(`Unknown cart item: ${item.id}`)
  return { name: spot.label, mxn: spot.price }
}

export function resolveCharge(
  items: CartLine[],
  locale: Locale,
  fx: { fix: number; margin: number }
): ResolvedCharge {
  const currency = locale === 'en' ? 'USD' : 'MXN'

  const lineItems: ChargeLineItem[] = items.map((item) => {
    if (!Number.isInteger(item.qty) || item.qty <= 0) {
      throw new Error(`Invalid quantity for cart item: ${item.id}`)
    }
    const { name, mxn } = basePrice(item)
    const unitAmount =
      currency === 'USD' ? mxnToUsd(mxn, fx.fix, fx.margin) : mxn
    return { id: item.id, name, unitAmount, qty: item.qty }
  })

  const total = round2(
    lineItems.reduce((sum, li) => sum + li.unitAmount * li.qty, 0)
  )

  return { currency, lineItems, total }
}
