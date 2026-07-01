'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { Product } from '@/lib/data'
import { CardArt } from '@/components/product/CardArt'
import { cn } from '@/lib/utils'

export function ProductGallery({ product }: { product: Product }) {
  const reducedMotion = useReducedMotion()
  const hasImages = product.images.length > 0
  const [active, setActive] = useState(0)
  const [origin, setOrigin] = useState('50% 50%')
  const [zoom, setZoom] = useState(false)
  const frameRef = useRef<HTMLDivElement>(null)

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reducedMotion) return
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setOrigin(`${x}% ${y}%`)
  }

  const activeSrc = hasImages ? product.images[active] : undefined

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={frameRef}
        onPointerMove={handleMove}
        onPointerEnter={() => !reducedMotion && setZoom(true)}
        onPointerLeave={() => setZoom(false)}
        className={cn(
          'relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--gold)_22%,transparent)] bg-panel',
          product.grade && product.grade.value >= 9.5 && 'holo-border'
        )}
      >
        {activeSrc ? (
          <div className="relative aspect-[2.5/3.5] w-full">
            <Image
              src={activeSrc}
              alt={`${product.name} — ${product.sport} card`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover transition-transform duration-300 ease-out will-change-transform"
              style={{
                transformOrigin: origin,
                transform: zoom ? 'scale(1.6)' : 'scale(1)',
              }}
            />
          </div>
        ) : (
          <div
            className="p-3 transition-transform duration-300 ease-out will-change-transform"
            style={{
              transformOrigin: origin,
              transform: zoom ? 'scale(1.15)' : 'scale(1)',
            }}
          >
            <CardArt product={product} size="detail" />
          </div>
        )}
      </div>

      {hasImages && product.images.length > 1 ? (
        <div className="flex gap-3">
          {product.images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={cn(
                'relative aspect-[2.5/3.5] w-20 overflow-hidden rounded-lg border transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                i === active
                  ? 'border-gold'
                  : 'border-white/10 hover:border-white/25'
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
