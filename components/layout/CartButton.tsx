'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCart, cartCount } from '@/lib/cart/store'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/getDictionary'

export function CartButton({
  locale,
  dict,
}: {
  locale: Locale
  dict: Dictionary
}) {
  const count = useCart((state) => cartCount(state))
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Link
      href={`/${locale}/cart`}
      aria-label={dict.nav.cart}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold/25 bg-panel-2/60 text-ink transition-colors hover:border-gold/50 hover:text-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <CartIcon />
      {mounted && count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-semibold leading-5 text-bg tabular-nums"
        >
          {count}
        </span>
      ) : null}
      {mounted && count > 0 ? (
        <span className="sr-only">{count}</span>
      ) : null}
    </Link>
  )
}

function CartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.5 3h2l2.2 12.4a1 1 0 0 0 1 .8h9.3a1 1 0 0 0 1-.78L21 7H6" />
    </svg>
  )
}
