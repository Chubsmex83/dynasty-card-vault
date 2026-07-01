'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart/store'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Break } from '@/lib/data'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/getDictionary'

export function SpotGrid({
  brk,
  locale,
  dict,
}: {
  brk: Break
  locale: Locale
  dict: Dictionary
}) {
  const [added, setAdded] = useState<string | null>(null)

  function handleAdd(spotId: string, label: string, price: number) {
    useCart.getState().addItem({
      id: `${brk.id}:${spotId}`,
      kind: 'spot',
      name: `${brk.title} — ${label}`,
      price,
      meta: { break: brk.title, spot: label },
    })
    setAdded(spotId)
  }

  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted">
        {dict.breaks.spots}
      </p>
      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {brk.spots.map((spot) => {
          const isAdded = added === spot.id
          const disabled = !spot.available || brk.status === 'completed'
          return (
            <li key={spot.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleAdd(spot.id, spot.label, spot.price)}
                aria-label={
                  disabled
                    ? `${spot.label} — ${dict.common.soldOut}`
                    : `${dict.breaks.joinBreak}: ${spot.label}`
                }
                className={cn(
                  'group flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                  disabled
                    ? 'cursor-not-allowed bg-white/[0.02] text-muted ring-1 ring-inset ring-white/5 opacity-60'
                    : 'bg-panel-2 text-ink ring-1 ring-inset ring-[color-mix(in_srgb,var(--gold)_18%,transparent)] hover:-translate-y-0.5 hover:ring-[color-mix(in_srgb,var(--gold)_45%,transparent)] active:translate-y-px',
                  isAdded &&
                    !disabled &&
                    'ring-2 ring-gold bg-[color-mix(in_srgb,var(--gold)_12%,var(--panel-2))]'
                )}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {spot.label}
                  </span>
                  {disabled ? (
                    <span className="text-xs uppercase tracking-[0.16em] text-muted">
                      {dict.common.soldOut}
                    </span>
                  ) : isAdded ? (
                    <span className="text-xs uppercase tracking-[0.16em] text-gold">
                      {dict.product.addedToCart}
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    'font-display text-sm font-semibold tabular-nums',
                    disabled ? 'text-muted line-through' : 'text-gold'
                  )}
                >
                  {formatPrice(spot.price, locale)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
