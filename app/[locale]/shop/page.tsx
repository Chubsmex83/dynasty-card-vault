import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/getDictionary'
import {
  getProducts,
  search,
  type ProductFilter,
  type Category,
  type Sport,
  type Availability,
} from '@/lib/data'
import { Filters } from '@/components/search/Filters'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Skeleton } from '@/components/ui/Skeleton'
import { pageMetadata, breadcrumbJsonLd, JsonLd } from '@/lib/seo'

const CATEGORY_VALUES: Category[] = ['single', 'sealed', 'memorabilia']
const SPORT_VALUES: Sport[] = [
  'nba',
  'mlb',
  'nfl',
  'nhl',
  'pokemon',
  'soccer',
  'f1',
  'ufc',
  'onepiece',
  'mtg',
]
const GRADE_VALUES = ['PSA', 'BGS', 'SGC'] as const
const AVAILABILITY_VALUES: Availability[] = ['in_stock', 'sold_out', 'preorder']
const SORT_VALUES = ['price_asc', 'price_desc', 'newest', 'value'] as const

const CATALOG_DESCRIPTION: Record<Locale, string> = {
  es: 'Explora el catálogo completo: singles certificados, cajas selladas y memorabilia autenticada, con filtros por deporte, grado y disponibilidad.',
  en: 'Browse the full catalog: certified singles, sealed boxes, and authenticated memorabilia, with filters by sport, grade, and availability.',
}

type SearchParams = Record<string, string | string[] | undefined>

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

function inSet<T extends string>(v: string | undefined, set: readonly T[]): T | undefined {
  return v !== undefined && (set as readonly string[]).includes(v) ? (v as T) : undefined
}

function toNumber(v: string | undefined): number | undefined {
  if (v === undefined || v.trim() === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

function buildFilter(sp: SearchParams): ProductFilter {
  return {
    category: inSet(first(sp.category), CATEGORY_VALUES),
    sport: inSet(first(sp.sport), SPORT_VALUES),
    grade: inSet(first(sp.grade), GRADE_VALUES),
    availability: inSet(first(sp.availability), AVAILABILITY_VALUES),
    minPrice: toNumber(first(sp.minPrice)),
    maxPrice: toNumber(first(sp.maxPrice)),
    sort: inSet(first(sp.sort), SORT_VALUES),
  }
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
    title: dict.nav.shop,
    description: CATALOG_DESCRIPTION[locale],
    path: '/shop',
    locale,
  })
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<SearchParams>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const sp = await searchParams
  const dict = await getDictionary(locale)
  const filter = buildFilter(sp)

  let products = getProducts(filter)

  const q = first(sp.q)?.trim()
  if (q) {
    const matchIds = new Set(search(q, 100).map((p) => p.id))
    products = products.filter((p) => matchIds.has(p.id))
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 py-12 lg:py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: `/${locale}` },
          { name: dict.nav.shop, url: `/${locale}/shop` },
        ])}
      />

      <header className="mb-8 flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {dict.nav.shop}
        </h1>
        <p className="text-sm text-muted">
          {products.length} {dict.common.results}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside>
          <Suspense
            fallback={<Skeleton className="h-[520px] w-full rounded-2xl" />}
          >
            <Filters locale={locale} dict={dict} value={filter} />
          </Suspense>
        </aside>

        <div>
          <ProductGrid products={products} locale={locale} dict={dict} />
        </div>
      </div>
    </div>
  )
}
