import type { Product } from '@/lib/data'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/getDictionary'
import { Reveal } from '@/components/motion/Reveal'
import { ProductCard } from '@/components/product/ProductCard'

export function ProductGrid({
  products,
  locale,
  dict,
}: {
  products: Product[]
  locale: Locale
  dict: Dictionary
}) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-panel/50 px-6 py-16">
        <p className="text-sm text-muted">{dict.common.empty}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product, i) => (
        <Reveal key={product.id} delay={Math.min(i, 8) * 0.05}>
          <ProductCard product={product} locale={locale} dict={dict} />
        </Reveal>
      ))}
    </div>
  )
}
