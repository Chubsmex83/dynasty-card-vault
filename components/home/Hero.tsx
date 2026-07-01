'use client'

import { useRef } from 'react'
import Link from 'next/link'
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from 'framer-motion'
import type { Product } from '@/lib/data'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/getDictionary'
import { CardArt } from '@/components/product/CardArt'
import { buttonClasses } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// Layout recipe for each floating slab in the hero composition.
// depth drives the scroll-parallax rate; float/delay drive the idle drift.
const SLOTS = [
  { rotate: -8, x: '-14%', y: '8%', z: 10, scale: 0.82, depth: 90, float: 14, delay: 0 },
  { rotate: 6, x: '20%', y: '-6%', z: 20, scale: 0.88, depth: 150, float: 18, delay: 0.6 },
  { rotate: -2, x: '0%', y: '0%', z: 30, scale: 1, depth: 40, float: 10, delay: 0.3 },
  { rotate: 12, x: '40%', y: '18%', z: 15, scale: 0.72, depth: 200, float: 22, delay: 1.1 },
  { rotate: -14, x: '-38%', y: '-14%', z: 5, scale: 0.68, depth: 220, float: 20, delay: 0.9 },
]

function FloatingCard({
  product,
  slot,
  scrollY,
  reduced,
}: {
  product: Product
  slot: (typeof SLOTS)[number]
  scrollY: MotionValue<number>
  reduced: boolean
}) {
  // Cards deeper in the stack travel faster as the page scrolls.
  const parallax = useTransform(scrollY, [0, 1], [0, -slot.depth])

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 w-[42%] max-w-[220px] sm:w-[38%]"
      style={{
        x: slot.x,
        y: reduced ? slot.y : parallax,
        translateX: '-50%',
        translateY: '-50%',
        rotate: slot.rotate,
        scale: slot.scale,
        zIndex: slot.z,
      }}
      initial={reduced ? false : { opacity: 0, y: 40 }}
      animate={reduced ? undefined : { opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
        animate={
          reduced
            ? undefined
            : { y: [0, -slot.float, 0], rotate: [0, slot.rotate > 0 ? 1.5 : -1.5, 0] }
        }
        transition={
          reduced
            ? undefined
            : {
                duration: 6 + slot.delay * 2,
                delay: slot.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }
        }
      >
        <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
          <CardArt product={product} size="grid" />
        </div>
      </motion.div>
    </motion.div>
  )
}

export function Hero({
  locale,
  dict,
  showcase,
}: {
  locale: Locale
  dict: Dictionary
  showcase: Product[]
}) {
  const reduced = useReducedMotion() ?? false
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const cards = showcase.slice(0, 5)

  // Accent the final word of the headline with the holo foil — one hero jewel.
  const words = dict.home.heroTitle.trim().split(' ')
  const lead = words.slice(0, -1).join(' ')
  const last = words[words.length - 1]

  return (
    <section
      ref={ref}
      className="relative overflow-hidden border-b border-white/5"
      aria-labelledby="hero-title"
    >
      {/* ambient vault glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(80% 60% at 78% 18%, color-mix(in srgb, var(--gold) 12%, transparent), transparent 60%), radial-gradient(60% 50% at 12% 90%, color-mix(in srgb, var(--holo-2) 10%, transparent), transparent 65%)',
        }}
      />

      <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-6 py-20 sm:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        {/* copy */}
        <div className="max-w-xl">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">
            {dict.home.heroKicker}
          </p>
          <h1
            id="hero-title"
            className="mt-5 font-display text-[clamp(2.75rem,6vw,5.25rem)] font-semibold leading-[1.02] tracking-tight text-ink"
          >
            {lead}{' '}
            <span className="holo-text">{last}</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted sm:text-lg">
            {dict.home.heroSubtitle}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href={`/${locale}/shop`} className={buttonClasses('gold', 'lg')}>
              {dict.home.heroCta}
            </Link>
            <Link href={`/${locale}/breaks`} className={buttonClasses('ghost', 'lg')}>
              {dict.nav.breaks}
            </Link>
          </div>
        </div>

        {/* floating slab composition */}
        <div
          aria-hidden={cards.length === 0}
          className="relative mx-auto h-[360px] w-full max-w-[520px] sm:h-[460px] lg:h-[540px]"
        >
          {cards.map((product, i) => (
            <FloatingCard
              key={product.id}
              product={product}
              slot={SLOTS[i] ?? SLOTS[SLOTS.length - 1]}
              scrollY={scrollYProgress}
              reduced={reduced}
            />
          ))}
          {/* soft floor reflection */}
          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-x-8 bottom-0 h-24 rounded-[50%]',
              'bg-[radial-gradient(closest-side,rgba(201,162,75,0.14),transparent)] blur-xl'
            )}
          />
        </div>
      </div>
    </section>
  )
}
