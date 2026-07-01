import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { isLocale, locales } from '@/i18n/config'
import { getDictionary } from '@/i18n/getDictionary'
import { getProducts, getProductBySlug, type Availability } from '@/lib/data'
import { ProductGallery } from '@/components/product/ProductGallery'
import { RelatedProducts } from '@/components/product/RelatedProducts'
import { AddToCartButton } from '@/components/product/AddToCartButton'
import { GradeBadge } from '@/components/ui/GradeBadge'
import { PriceTag } from '@/components/ui/PriceTag'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { pageMetadata, breadcrumbJsonLd, productJsonLd, JsonLd } from '@/lib/seo'

const AVAILABILITY_TONE: Record<Availability, BadgeTone> = {
  in_stock: 'green',
  sold_out: 'red',
  preorder: 'gold',
}

const AVAILABILITY_LABEL: Record<Availability, 'inStock' | 'soldOut' | 'preorder'> = {
  in_stock: 'inStock',
  sold_out: 'soldOut',
  preorder: 'preorder',
}

export function generateStaticParams() {
  return getProducts().flatMap((product) =>
    locales.map((locale) => ({ locale, slug: product.slug }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const product = getProductBySlug(slug)
  if (!isLocale(locale) || !product) {
    return { title: 'Dynasty Card Vault' }
  }
  return pageMetadata({
    title: product.name,
    description: product.description,
    path: `/product/${slug}`,
    locale,
    images: product.images.length > 0 ? product.images : undefined,
  })
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()

  const product = getProductBySlug(slug)
  if (!product) notFound()

  const dict = await getDictionary(locale)

  const microLabels = [product.brand, product.year, dict.sports[product.sport]]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 py-12 lg:py-16">
      <JsonLd
        data={[
          productJsonLd(product, locale),
          breadcrumbJsonLd([
            { name: 'Home', url: `/${locale}` },
            { name: dict.nav.shop, url: `/${locale}/shop` },
            { name: product.name, url: `/${locale}/product/${product.slug}` },
          ]),
        ]}
      />

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-8 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted"
      >
        <Link href={`/${locale}`} className="transition-colors hover:text-gold">
          {dict.nav.brand}
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={`/${locale}/shop`} className="transition-colors hover:text-gold">
          {dict.nav.shop}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery product={product} />

        <div className="flex flex-col gap-6">
          {microLabels ? (
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
              {microLabels}
            </p>
          ) : null}

          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
            {product.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            {product.grade ? <GradeBadge grade={product.grade} /> : null}
            <Badge tone={AVAILABILITY_TONE[product.availability]}>
              {dict.common[AVAILABILITY_LABEL[product.availability]]}
            </Badge>
          </div>

          <PriceTag
            value={product.price}
            locale={locale}
            className="text-3xl sm:text-4xl"
          />

          <AddToCartButton product={product} dict={dict} />

          {/* Grading / condition explainer */}
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="flex flex-col gap-1 bg-panel p-4">
              <dt className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                {dict.product.grading}
              </dt>
              <dd className="font-display text-sm text-ink">
                {product.grade
                  ? `${product.grade.company} ${
                      Number.isInteger(product.grade.value)
                        ? product.grade.value
                        : product.grade.value.toFixed(1)
                    }`
                  : '—'}
              </dd>
            </div>
            <div className="flex flex-col gap-1 bg-panel p-4">
              <dt className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                {dict.product.condition}
              </dt>
              <dd className="font-display text-sm text-ink">
                {dict.categories[product.category]}
              </dd>
            </div>
          </dl>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              {dict.product.description}
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      <RelatedProducts product={product} locale={locale} dict={dict} />
    </div>
  )
}
