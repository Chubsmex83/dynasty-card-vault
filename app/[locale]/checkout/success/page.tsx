import Link from 'next/link'
import { getDictionary } from '@/i18n/getDictionary'
import type { Locale } from '@/i18n/config'
import { stripe } from '@/lib/checkout/stripe'
import { buttonClasses } from '@/components/ui/Button'
import { ClearCartOnMount } from '@/components/checkout/ClearCartOnMount'

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ provider?: string; session_id?: string }>
}) {
  const { locale } = await params
  const { provider, session_id } = await searchParams
  const dict = await getDictionary(locale)

  let paid = false
  if (provider === 'paypal') {
    paid = true // capture already confirmed server-side
  } else if (provider === 'stripe' && session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id)
      paid = session.payment_status === 'paid'
    } catch {
      paid = false
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-20 text-center sm:px-6">
      {paid ? <ClearCartOnMount /> : null}
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
        {paid ? dict.checkout.successTitle : dict.checkout.failedTitle}
      </h1>
      <p className="mt-4 text-muted">
        {paid ? dict.checkout.successBody : dict.checkout.failedBody}
      </p>
      <Link
        href={`/${locale}/shop`}
        className={buttonClasses('gold', 'md') + ' mt-8 inline-flex'}
      >
        {dict.checkout.emptyCta}
      </Link>
    </main>
  )
}
