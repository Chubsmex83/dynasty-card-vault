import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/getDictionary'
import { pageMetadata } from '@/lib/seo'
import { CartView } from '@/components/cart/CartView'

const DESCRIPTION: Record<Locale, string> = {
  es: 'Revisa los artículos y spots de break guardados en tu carrito de Dynasty Card Vault.',
  en: 'Review the items and break spots saved in your Dynasty Card Vault cart.',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = await getDictionary(locale)
  return {
    ...pageMetadata({
      title: dict.cart.title,
      description: DESCRIPTION[locale],
      path: '/cart',
      locale,
    }),
    robots: { index: false },
  }
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const dict = await getDictionary(locale)

  return (
    <section className="mx-auto w-full max-w-[1280px] px-6 py-14 sm:py-20">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {dict.cart.title}
      </h1>
      <CartView locale={locale} dict={dict} />
    </section>
  )
}
