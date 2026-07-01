import Link from 'next/link'
import type { Product } from '@/lib/data'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/getDictionary'
import { ProductGrid } from '@/components/product/ProductGrid'
import { buttonClasses } from '@/components/ui/Button'

export function SectionRow({
  title,
  products,
  locale,
  dict,
  viewAllHref,
}: {
  title: string
  products: Product[]
  locale: Locale
  dict: Dictionary
  viewAllHref?: string
}) {
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-14 sm:py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <span
            aria-hidden="true"
            className="mb-3 block h-px w-10 bg-[color-mix(in_srgb,var(--gold)_60%,transparent)]"
          />
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {title}
          </h2>
        </div>
        {viewAllHref ? (
          <Link href={viewAllHref} className={buttonClasses('ghost', 'sm')}>
            {dict.nav.shop}
          </Link>
        ) : null}
      </div>
      <ProductGrid products={products} locale={locale} dict={dict} />
    </section>
  )
}
