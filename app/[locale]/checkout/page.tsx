import { getDictionary } from '@/i18n/getDictionary'
import type { Locale } from '@/i18n/config'
import { CheckoutView } from '@/components/checkout/CheckoutView'

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
        {dict.checkout.title}
      </h1>
      <CheckoutView
        locale={locale}
        dict={dict}
        paypalClientId={process.env.PAYPAL_CLIENT_ID ?? ''}
      />
    </main>
  )
}
