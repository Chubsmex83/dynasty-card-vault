import { getRelated, type Product } from '@/lib/data'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/getDictionary'
import { ProductGrid } from '@/components/product/ProductGrid'

export function RelatedProducts({
  product,
  locale,
  dict,
}: {
  product: Product
  locale: Locale
  dict: Dictionary
}) {
  const related = getRelated(product, 4)
  if (related.length === 0) return null

  return (
    <section className="mt-16">
      <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight text-ink">
        {dict.product.related}
      </h2>
      <ProductGrid products={related} locale={locale} dict={dict} />
    </section>
  )
}
