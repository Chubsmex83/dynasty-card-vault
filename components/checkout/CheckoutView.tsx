'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { useCart } from '@/lib/cart/store'
import { formatMXN, formatUSD } from '@/lib/money'
import { buttonClasses } from '@/components/ui/Button'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/getDictionary'
import type { ResolvedCharge } from '@/lib/checkout/resolveCharge'

type Line = { id: string; kind: 'product' | 'spot'; qty: number }

export function CheckoutView({
  locale,
  dict,
  paypalClientId,
}: {
  locale: Locale
  dict: Dictionary
  paypalClientId: string
}) {
  const router = useRouter()
  const items = useCart((s) => s.items)
  const [mounted, setMounted] = useState(false)
  const [quote, setQuote] = useState<ResolvedCharge | null>(null)
  const [error, setError] = useState<string | null>(null)

  const lines: Line[] = items.map((i) => ({ id: i.id, kind: i.kind, qty: i.qty }))

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted || lines.length === 0) return
    let active = true
    fetch('/api/checkout/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: lines, locale }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return
        if (data.error) setError(data.error)
        else setQuote(data)
      })
      .catch(() => active && setError('quote_failed'))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, locale, JSON.stringify(lines)])

  if (!mounted) {
    return <div className="mt-8 h-40 animate-pulse rounded-2xl bg-panel" aria-hidden />
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center gap-6 rounded-2xl bg-panel px-6 py-16 text-center ring-1 ring-inset ring-white/10">
        <p className="text-lg text-muted">{dict.checkout.empty}</p>
        <Link href={`/${locale}/shop`} className={buttonClasses('gold', 'md')}>
          {dict.checkout.emptyCta}
        </Link>
      </div>
    )
  }

  const fmt = (n: number) =>
    quote?.currency === 'USD' ? formatUSD(n) : formatMXN(n)

  if (!quote && !error) {
    return <div className="mt-8 h-40 animate-pulse rounded-2xl bg-panel" aria-hidden />
  }

  async function payWithStripe() {
    setError(null)
    const res = await fetch('/api/checkout/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: lines, locale }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setError(data.error ?? 'checkout_failed')
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_22rem]">
      <section className="rounded-2xl bg-panel p-6 ring-1 ring-inset ring-white/10">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
          {dict.checkout.summary}
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {(quote?.lineItems ?? []).map((li) => (
            <li key={li.id} className="flex justify-between gap-4 text-sm text-ink">
              <span className="min-w-0 truncate">
                {li.name} × {li.qty}
              </span>
              <span className="tabular-nums">{fmt(li.unitAmount * li.qty)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">{dict.checkout.currencyNote}</p>
        <div className="mt-6 border-t border-white/10 pt-4 text-xs text-muted">
          <h3 className="font-medium text-ink">{dict.checkout.transparencyTitle}</h3>
          <p className="mt-2">{dict.checkout.transparencyPayments}</p>
          <p className="mt-1">{dict.checkout.transparencyShipping}</p>
          <p className="mt-1">{dict.checkout.transparencyDelivery}</p>
          <p className="mt-2">
            {dict.checkout.transparencyPolicies}{' '}
            <Link href={`/${locale}/legal/terms`} className="text-gold underline-offset-4 hover:underline">
              {dict.checkout.termsLink}
            </Link>
            {' · '}
            <Link href={`/${locale}/legal/sales`} className="text-gold underline-offset-4 hover:underline">
              {dict.checkout.salesLink}
            </Link>
            .
          </p>
        </div>
      </section>

      <aside className="h-fit rounded-2xl bg-panel p-6 ring-1 ring-inset ring-[color-mix(in_srgb,var(--gold)_16%,transparent)] lg:sticky lg:top-24">
        <p className="font-display text-3xl font-semibold tabular-nums text-ink">
          {quote ? fmt(quote.total) : '—'}
        </p>

        <div className="mt-6">
          {locale === 'es' ? (
            <button
              type="button"
              onClick={payWithStripe}
              className={buttonClasses('gold', 'lg') + ' w-full'}
            >
              {dict.checkout.payWithCard}
            </button>
          ) : (
            <PayPalScriptProvider
              options={{ clientId: paypalClientId, currency: 'USD', intent: 'capture' }}
            >
              <PayPalButtons
                style={{ layout: 'vertical' }}
                createOrder={async () => {
                  const res = await fetch('/api/checkout/paypal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: lines, locale }),
                  })
                  const data = await res.json()
                  if (!data.orderId) throw new Error(data.error ?? 'create_failed')
                  return data.orderId
                }}
                onApprove={async (data) => {
                  setError(null)
                  const res = await fetch('/api/checkout/paypal/capture', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId: data.orderID }),
                  })
                  const result = await res.json()
                  if (res.ok && result.status === 'COMPLETED') {
                    router.push(`/${locale}/checkout/success?provider=paypal`)
                  } else {
                    setError(result.error ?? 'payment_failed')
                  }
                }}
                onError={() => setError('payment_failed')}
                onCancel={() => setError(null)}
              />
            </PayPalScriptProvider>
          )}
        </div>

        {error ? (
          <p className="mt-3 text-center text-xs text-rose-300">{error}</p>
        ) : null}

        <Link
          href={`/${locale}/cart`}
          className="mt-4 block text-center text-sm text-gold underline-offset-4 hover:underline"
        >
          {dict.checkout.backToCart}
        </Link>
      </aside>
    </div>
  )
}
