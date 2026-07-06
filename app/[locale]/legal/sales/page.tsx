import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/getDictionary'
import { pageMetadata } from '@/lib/seo'
import { LegalLayout } from '@/components/legal/LegalLayout'
import SalesEs from '@/content/legal/sales.es'
import SalesEn from '@/content/legal/sales.en'

const DESCRIPTION: Record<Locale, string> = {
  es: 'Política de Ventas y No Devoluciones de Dynasty Card Vault: todas las ventas son finales.',
  en: 'Dynasty Card Vault Sales and No-Returns Policy: all sales are final.',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = await getDictionary(locale)
  return pageMetadata({
    title: dict.legal.salesTitle,
    description: DESCRIPTION[locale],
    path: '/legal/sales',
    locale,
  })
}

export default async function SalesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = await getDictionary(locale)
  return (
    <LegalLayout title={dict.legal.salesTitle} lastUpdatedLabel={dict.legal.lastUpdated}>
      {locale === 'en' ? <SalesEn /> : <SalesEs />}
    </LegalLayout>
  )
}
