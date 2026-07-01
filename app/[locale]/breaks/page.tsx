import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/getDictionary'
import { getBreaks } from '@/lib/data'
import {
  pageMetadata,
  breadcrumbJsonLd,
  JsonLd,
  SITE_URL,
  SITE_NAME,
} from '@/lib/seo'
import { Reveal } from '@/components/motion/Reveal'
import { BreakCard } from '@/components/breaks/BreakCard'

const DESCRIPTION: Record<Locale, string> = {
  es: 'Únete a nuestros breaks en vivo: abrimos cajas selladas en directo y cada participante recibe las cartas de su spot o equipo asignado. Reserva tu lugar antes de que se agote.',
  en: 'Join our live breaks: we open sealed boxes on stream and every participant receives the cards for their assigned spot or team. Lock in your place before it sells out.',
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
    title: dict.home.breaksTitle,
    description: DESCRIPTION[locale],
    path: '/breaks',
    locale,
  })
}

export default async function BreaksPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const dict = await getDictionary(locale)
  const breaks = getBreaks()

  return (
    <section className="mx-auto w-full max-w-[1280px] px-6 py-14 sm:py-20">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: SITE_NAME, url: `${SITE_URL}/${locale}` },
          {
            name: dict.home.breaksTitle,
            url: `${SITE_URL}/${locale}/breaks`,
          },
        ])}
      />

      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
          {dict.nav.breaks}
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {dict.home.breaksTitle}
        </h1>
        <p className="mt-4 text-base text-muted">{dict.home.breaksSubtitle}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {DESCRIPTION[locale]}
        </p>
      </header>

      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {breaks.map((brk, i) => (
          <Reveal key={brk.id} delay={(i % 2) * 0.08}>
            <BreakCard brk={brk} locale={locale} dict={dict} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
