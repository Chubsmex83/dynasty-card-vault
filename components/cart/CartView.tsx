'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCart, cartTotal, type CartItem } from '@/lib/cart/store'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import { buttonClasses } from '@/components/ui/Button'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/getDictionary'

export function CartView({
  locale,
  dict,
}: {
  locale: Locale
  dict: Dictionary
}) {
  const [mounted, setMounted] = useState(false)
  const items = useCart((state) => state.items)
  const setQty = useCart((state) => state.setQty)
  const removeItem = useCart((state) => state.removeItem)
  const total = useCart(cartTotal)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className="mt-8 h-40 animate-pulse rounded-2xl bg-panel"
        aria-hidden
      />
    )
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center gap-6 rounded-2xl bg-panel px-6 py-16 text-center ring-1 ring-inset ring-white/10">
        <p className="text-lg text-muted">{dict.cart.empty}</p>
        <Link href={`/${locale}/shop`} className={buttonClasses('gold', 'md')}>
          {dict.cart.emptyCta}
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_20rem]">
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <CartRow
            key={item.id}
            item={item}
            locale={locale}
            dict={dict}
            onDec={() => setQty(item.id, item.qty - 1)}
            onInc={() => setQty(item.id, item.qty + 1)}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </ul>

      <aside className="h-fit rounded-2xl bg-panel p-6 ring-1 ring-inset ring-[color-mix(in_srgb,var(--gold)_16%,transparent)] lg:sticky lg:top-24">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
          {dict.cart.total}
        </h2>
        <p className="mt-2 font-display text-3xl font-semibold tracking-tight tabular-nums text-ink">
          {formatPrice(total, locale)}
        </p>
        <Link
          href={`/${locale}/checkout`}
          className={cn(buttonClasses('gold', 'lg'), 'mt-6 w-full')}
        >
          {dict.cart.checkout}
        </Link>
        <Link
          href={`/${locale}/shop`}
          className="mt-4 block text-center text-sm text-gold underline-offset-4 transition-colors hover:text-gold-soft hover:underline"
        >
          {dict.cart.continueShopping}
        </Link>
      </aside>
    </div>
  )
}

function CartRow({
  item,
  locale,
  dict,
  onDec,
  onInc,
  onRemove,
}: {
  item: CartItem
  locale: Locale
  dict: Dictionary
  onDec: () => void
  onInc: () => void
  onRemove: () => void
}) {
  const stepperBtn =
    'flex h-8 w-8 items-center justify-center rounded-full text-ink ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/5 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <li className="flex flex-col gap-4 rounded-2xl bg-panel p-4 ring-1 ring-inset ring-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-sm font-medium text-ink">{item.name}</p>
        {item.kind === 'spot' && item.meta?.spot ? (
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            {item.meta.spot}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div
          className="flex items-center gap-2"
          role="group"
          aria-label={dict.cart.quantity}
        >
          <button
            type="button"
            className={stepperBtn}
            onClick={onDec}
            disabled={item.qty <= 1}
            aria-label="−"
          >
            <span aria-hidden>−</span>
          </button>
          <span className="w-6 text-center text-sm font-medium tabular-nums text-ink">
            {item.qty}
          </span>
          <button
            type="button"
            className={stepperBtn}
            onClick={onInc}
            aria-label="+"
          >
            <span aria-hidden>+</span>
          </button>
        </div>

        <span className="w-24 text-right font-display text-base font-semibold tabular-nums text-ink">
          {formatPrice(item.price * item.qty, locale)}
        </span>

        <button
          type="button"
          onClick={onRemove}
          className={cn(
            'text-xs uppercase tracking-[0.16em] text-muted transition-colors hover:text-rose-300',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded'
          )}
        >
          {dict.cart.remove}
        </button>
      </div>
    </li>
  )
}
