import Link from 'next/link'
import type { Category } from '@/lib/data'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/getDictionary'
import { Reveal } from '@/components/motion/Reveal'
import { cn } from '@/lib/utils'

type Tile = {
  category: Category
  nameKey: 'single' | 'sealed' | 'memorabilia'
  descKey: 'singleDesc' | 'sealedDesc' | 'memorabiliaDesc'
  hue: number
}

const TILES: Tile[] = [
  { category: 'single', nameKey: 'single', descKey: 'singleDesc', hue: 210 },
  { category: 'sealed', nameKey: 'sealed', descKey: 'sealedDesc', hue: 145 },
  { category: 'memorabilia', nameKey: 'memorabilia', descKey: 'memorabiliaDesc', hue: 40 },
]

export function CategoryTiles({
  locale,
  dict,
}: {
  locale: Locale
  dict: Dictionary
}) {
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-16">
      <div className="mb-8">
        <span
          aria-hidden="true"
          className="mb-3 block h-px w-10 bg-[color-mix(in_srgb,var(--gold)_60%,transparent)]"
        />
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {dict.home.categoriesTitle}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {TILES.map((tile, i) => (
          <Reveal key={tile.category} delay={i * 0.08}>
            <Link
              href={`/${locale}/shop?category=${tile.category}`}
              className={cn(
                'group relative flex h-full min-h-[220px] flex-col justify-end overflow-hidden rounded-2xl bg-panel p-6',
                'ring-1 ring-[color-mix(in_srgb,var(--gold)_20%,transparent)]',
                'transition-all duration-300 hover:-translate-y-1 hover:ring-[color-mix(in_srgb,var(--gold)_45%,transparent)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold'
              )}
            >
              {/* per-category ambient wash */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(120% 90% at 85% 0%, hsl(${tile.hue} 70% 55% / 0.16), transparent 60%)`,
                }}
              />
              {/* holo sweep revealed on hover */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    'linear-gradient(115deg, transparent 30%, color-mix(in srgb, var(--holo-1) 22%, transparent) 50%, color-mix(in srgb, var(--holo-2) 18%, transparent) 62%, transparent 78%)',
                }}
              />

              <div className="relative">
                <h3 className="font-display text-xl font-semibold tracking-tight text-ink">
                  {dict.categories[tile.nameKey]}
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
                  {dict.categories[tile.descKey]}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-gold transition-transform duration-300 group-hover:translate-x-1">
                  {dict.common.viewDetails}
                  <svg
                    aria-hidden="true"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
