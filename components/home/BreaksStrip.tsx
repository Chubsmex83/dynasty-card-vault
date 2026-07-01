import Link from 'next/link'
import type { Break } from '@/lib/data'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/getDictionary'
import { Reveal } from '@/components/motion/Reveal'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/Button'

export function BreaksStrip({
  breaks,
  locale,
  dict,
}: {
  breaks: Break[]
  locale: Locale
  dict: Dictionary
}) {
  const featured = breaks.slice(0, 3)

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-16">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl bg-panel p-8 ring-1 ring-[color-mix(in_srgb,var(--gold)_22%,transparent)] sm:p-10">
          {/* live spotlight wash */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(70% 120% at 90% 0%, color-mix(in srgb, var(--holo-1) 12%, transparent), transparent 55%), radial-gradient(60% 100% at 0% 100%, color-mix(in srgb, var(--gold) 12%, transparent), transparent 60%)',
            }}
          />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-lg">
              <Badge tone="holo">{dict.breaks.live}</Badge>
              <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                {dict.home.breaksTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                {dict.home.breaksSubtitle}
              </p>
              <Link
                href={`/${locale}/breaks`}
                className={`${buttonClasses('gold', 'md')} mt-6`}
              >
                {dict.nav.breaks}
              </Link>
            </div>

            {featured.length > 0 ? (
              <ul className="flex w-full max-w-md flex-col gap-3">
                {featured.map((brk) => {
                  const open = brk.spots.filter((s) => s.available).length
                  return (
                    <li key={brk.id}>
                      <Link
                        href={`/${locale}/breaks/${brk.slug}`}
                        className="group flex items-center justify-between gap-4 rounded-xl bg-panel-2/80 px-4 py-3 ring-1 ring-white/5 transition-colors hover:ring-[color-mix(in_srgb,var(--gold)_35%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-ink">
                            {brk.title}
                          </span>
                          <span className="mt-0.5 block text-xs uppercase tracking-[0.16em] text-muted">
                            {dict.sports[brk.sport]}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block font-display text-base font-semibold tabular-nums text-gold">
                            {open}
                          </span>
                          <span className="block text-[10px] uppercase tracking-[0.16em] text-muted">
                            {dict.breaks.spotsAvailable}
                          </span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>
        </div>
      </Reveal>
    </section>
  )
}
