import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/getDictionary'
import { getFeatured, getNewArrivals, getBreaks } from '@/lib/data'
import { pageMetadata } from '@/lib/seo'
import { Hero } from '@/components/home/Hero'
import { SectionRow } from '@/components/home/SectionRow'
import { BreaksStrip } from '@/components/home/BreaksStrip'
import { CategoryTiles } from '@/components/home/CategoryTiles'
import { ValueProps } from '@/components/home/ValueProps'
import { FaqSection } from '@/components/home/FaqSection'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = await getDictionary(locale)
  return pageMetadata({
    title: dict.home.heroTitle,
    description: dict.home.heroSubtitle,
    path: '',
    locale,
  })
}

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  const typedLocale = locale as Locale
  const dict = await getDictionary(typedLocale)

  const featured = getFeatured().slice(0, 8)
  const newArrivals = getNewArrivals().slice(0, 8)
  const breaks = getBreaks()
  const showcase = getFeatured().slice(0, 5)

  return (
    <>
      <Hero locale={typedLocale} dict={dict} showcase={showcase} />

      <SectionRow
        title={dict.home.featured}
        products={featured}
        locale={typedLocale}
        dict={dict}
        viewAllHref={`/${typedLocale}/shop`}
      />

      <SectionRow
        title={dict.home.newArrivals}
        products={newArrivals}
        locale={typedLocale}
        dict={dict}
      />

      <BreaksStrip breaks={breaks} locale={typedLocale} dict={dict} />

      <CategoryTiles locale={typedLocale} dict={dict} />

      <ValueProps dict={dict} />

      <FaqSection dict={dict} />
    </>
  )
}
