import type { Product, Sport } from '@/lib/data'
import { cn } from '@/lib/utils'

// Distinct accent hue per sport so the grid feels varied yet cohesive.
const SPORT_HUE: Record<Sport, number> = {
  nba: 22, // ember orange
  mlb: 210, // steel blue
  nfl: 145, // field green
  nhl: 195, // ice cyan
  pokemon: 52, // electric gold
  soccer: 265, // violet
  f1: 0, // racing red
  ufc: 12, // blood orange
  onepiece: 320, // magenta
  mtg: 280, // arcane purple
  marvel: 350, // comic crimson
}

const SPORT_LABEL: Record<Sport, string> = {
  nba: 'NBA',
  mlb: 'MLB',
  nfl: 'NFL',
  nhl: 'NHL',
  pokemon: 'POKÉMON',
  soccer: 'SOCCER',
  f1: 'FORMULA 1',
  ufc: 'UFC',
  onepiece: 'ONE PIECE',
  mtg: 'MTG',
  marvel: 'MARVEL',
}

type Size = 'grid' | 'hero' | 'detail'

const SIZE_STYLE: Record<
  Size,
  { pad: string; player: string; meta: string; brand: string; num: string }
> = {
  grid: { pad: 'p-4', player: 'text-lg', meta: 'text-[10px]', brand: 'text-[10px]', num: 'text-xs' },
  hero: { pad: 'p-6', player: 'text-3xl', meta: 'text-xs', brand: 'text-xs', num: 'text-sm' },
  detail: { pad: 'p-6', player: 'text-2xl', meta: 'text-xs', brand: 'text-xs', num: 'text-sm' },
}

export function CardArt({
  product,
  size = 'grid',
  className,
}: {
  product: Product
  size?: Size
  className?: string
}) {
  const hue = product.sport ? SPORT_HUE[product.sport] : 45 // neutral gold for sportless items
  const s = SIZE_STYLE[size]
  const title = product.player ?? product.name
  const sportLabel = product.sport ? SPORT_LABEL[product.sport] : product.category.toUpperCase()

  const baseGradient = `linear-gradient(155deg,
    hsl(${hue} 45% 16%) 0%,
    hsl(${(hue + 24) % 360} 40% 10%) 45%,
    hsl(${(hue + 340) % 360} 38% 8%) 100%)`

  // Prismatic refractor streaks — diagonal foil bands.
  const foilTexture = `repeating-linear-gradient(115deg,
    hsl(${hue} 90% 65% / 0.10) 0px,
    hsl(${(hue + 60) % 360} 90% 65% / 0.04) 6px,
    transparent 12px,
    hsl(${(hue + 180) % 360} 90% 70% / 0.06) 18px,
    transparent 26px)`

  const glow = `radial-gradient(120% 80% at 25% 12%, hsl(${hue} 85% 60% / 0.28), transparent 55%)`

  return (
    <div
      role="img"
      aria-label={`${product.name} — ${sportLabel} card`}
      className={cn(
        'relative flex aspect-[2.5/3.5] w-full flex-col justify-between overflow-hidden rounded-xl',
        s.pad,
        className
      )}
      style={{ background: baseGradient }}
    >
      {/* layered foil + glow textures */}
      <div aria-hidden="true" className="absolute inset-0" style={{ background: foilTexture }} />
      <div aria-hidden="true" className="absolute inset-0" style={{ background: glow }} />
      {/* holographic sheen bar */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1/2 opacity-40"
        style={{
          background: `linear-gradient(160deg, hsl(${hue} 100% 75% / 0.22), transparent 60%)`,
        }}
      />
      {/* inner hairline frame */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-2 rounded-lg ring-1 ring-white/10"
      />

      {/* top row: brand / year */}
      <div className="relative flex items-start justify-between">
        <span
          className={cn(
            'font-medium uppercase tracking-[0.2em] text-white/70',
            s.brand
          )}
        >
          {product.brand ?? sportLabel}
        </span>
        {product.year ? (
          <span className={cn('font-display tabular-nums text-white/60', s.meta)}>
            {product.year}
          </span>
        ) : null}
      </div>

      {/* center emblem: sport monogram */}
      <div className="relative flex flex-1 items-center justify-center">
        <span
          className="font-display font-bold leading-none text-white/10"
          style={{ fontSize: size === 'grid' ? '3.5rem' : '6rem' }}
        >
          {sportLabel.slice(0, 3)}
        </span>
      </div>

      {/* bottom: player name + meta */}
      <div className="relative flex flex-col gap-1">
        <span
          className={cn(
            'font-display font-semibold leading-tight tracking-tight text-white line-clamp-2',
            s.player
          )}
        >
          {title}
        </span>
        <div className={cn('flex items-center justify-between text-white/60', s.meta)}>
          <span className="uppercase tracking-[0.16em]">{sportLabel}</span>
          {product.cardNumber ? (
            <span className={cn('font-display tabular-nums text-white/70', s.num)}>
              {product.cardNumber}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
