import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/getDictionary'
import { pageMetadata } from '@/lib/seo'
import { LegalLayout } from '@/components/legal/LegalLayout'
import TermsEs from '@/content/legal/terms.es'
import TermsEn from '@/content/legal/terms.en'

const DESCRIPTION: Record<Locale, string> = {
  es: 'Términos y Condiciones de Dynasty Card Vault, incluyendo el funcionamiento de los Live Breaks.',
  en: 'Dynasty Card Vault Terms and Conditions, including how Live Breaks work.',
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
    title: dict.legal.termsTitle,
    description: DESCRIPTION[locale],
    path: '/legal/terms',
    locale,
  })
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = await getDictionary(locale)
  return (
    <LegalLayout title={dict.legal.termsTitle} lastUpdatedLabel={dict.legal.lastUpdated}>
      {locale === 'en' ? <TermsEn /> : <TermsEs />}
    </LegalLayout>
  )
}
