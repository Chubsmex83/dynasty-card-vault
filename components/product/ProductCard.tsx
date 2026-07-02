'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { MouseEvent } from 'react'
import type { Product } from '@/lib/data'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/getDictionary'
import { useCart } from '@/lib/cart/store'
import { cn } from '@/lib/utils'
import { MotionCard } from '@/components/motion/MotionCard'
import { CardArt } from '@/components/product/CardArt'
import { GradeBadge } from '@/components/ui/GradeBadge'
import { PriceTag } from '@/components/ui/PriceTag'
import { Button } from '@/components/ui/Button'

export function ProductCard({
  product,
  locale,
  dict,
}: {
  product: Product
  locale: Locale
  dict: Dictionary
}) {
  const soldOut = product.availability === 'sold_out'
  const gemMint = Boolean(product.grade && product.grade.value >= 9.5)
  const hasImage = product.images.length > 0

  function handleAdd(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (soldOut) return
    useCart.getState().addItem({
      id: product.id,
      kind: 'product',
      name: product.name,
      price: product.price,
    })
  }

  return (
    <MotionCard className="h-full">
      <div
        className={cn(
          'group relative flex h-full flex-col overflow-hidden rounded-2xl bg-panel',
          'ring-1 ring-[color-mix(in_srgb,var(--gold)_22%,transparent)]',
          'transition-shadow duration-300 hover:shadow-[0_20px_50px_-24px_rgba(0,0,0,0.8)]',
          'focus-within:ring-2 focus-within:ring-gold',
          gemMint && 'holo-border'
        )}
      >
        {/* top label strip — slab header */}
        <div className="flex items-center justify-between gap-2 border-b border-white/5 bg-panel-2 px-3 py-2">
          <span className="truncate font-medium uppercase tracking-[0.2em] text-muted text-[10px]">
            {[product.brand, product.year].filter(Boolean).join(' · ') || product.category}
          </span>
          {product.grade ? <GradeBadge grade={product.grade} /> : null}
        </div>

        {/* middle — card art / photo */}
        <div className="relative p-3">
          {hasImage ? (
            <div className="relative aspect-[2.5/3.5] w-full overflow-hidden rounded-xl">
              <Image
                src={product.images[0]}
                alt={`${product.name} — ${product.sport} card`}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
          ) : (
            <CardArt product={product} size="grid" />
          )}
          {soldOut ? (
            <span className="absolute right-5 top-5 z-20 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-rose-200 backdrop-blur">
              {dict.common.soldOut}
            </span>
          ) : null}
        </div>

        {/* bottom — name, price, action (stacked so nothing clips on narrow cards) */}
        <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-1">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink">
            {product.name}
          </h3>
          <div className="mt-auto flex flex-col gap-2.5">
            <PriceTag
              value={product.price}
              locale={locale}
              className="truncate text-base sm:text-lg"
            />
            <Button
              variant="gold"
              size="sm"
              onClick={handleAdd}
              disabled={soldOut}
              aria-label={`${dict.common.addToCart} — ${product.name}`}
              className="relative z-20 w-full justify-center whitespace-nowrap text-xs"
            >
              {soldOut ? dict.common.soldOut : dict.common.addToCart}
            </Button>
          </div>
        </div>

        {/* stretched navigation link (covers the card, sits below the button) */}
        <Link
          href={`/${locale}/product/${product.slug}`}
          className="absolute inset-0 z-10 rounded-2xl focus:outline-none"
          aria-label={product.name}
        >
          <span className="sr-only">{product.name}</span>
        </Link>
      </div>
    </MotionCard>
  )
}
