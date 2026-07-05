import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/getDictionary'
import { pageMetadata } from '@/lib/seo'
import { LegalLayout } from '@/components/legal/LegalLayout'
import PrivacyEs from '@/content/legal/privacy.es'
import PrivacyEn from '@/content/legal/privacy.en'

const DESCRIPTION: Record<Locale, string> = {
  es: 'Aviso de Privacidad de Dynasty Card Vault: cómo recabamos, usamos y protegemos tus datos personales.',
  en: 'Dynasty Card Vault Privacy Notice: how we collect, use and protect your personal data.',
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
    title: dict.legal.privacyTitle,
    description: DESCRIPTION[locale],
    path: '/legal/privacy',
    locale,
  })
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = await getDictionary(locale)
  return (
    <LegalLayout title={dict.legal.privacyTitle} lastUpdatedLabel={dict.legal.lastUpdated}>
      {locale === 'en' ? <PrivacyEn /> : <PrivacyEs />}
    </LegalLayout>
  )
}
