import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { formatDate } from '@/lib/format'
import type { Break } from '@/lib/data'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/getDictionary'
import { SpotGrid } from './SpotGrid'

const STATUS_TONE: Record<Break['status'], BadgeTone> = {
  live: 'red',
  upcoming: 'gold',
  completed: 'muted',
}

export function BreakCard({
  brk,
  locale,
  dict,
}: {
  brk: Break
  locale: Locale
  dict: Dictionary
}) {
  const statusLabel = dict.breaks[brk.status]
  const availableCount = brk.spots.filter((s) => s.available).length
  const breakTypeLabel: Record<Break['breakType'], string> = {
    pyt: 'Pick Your Team',
    random: 'Random',
    division: 'Division',
  }

  return (
    <article className="flex flex-col gap-5 rounded-2xl bg-panel p-5 ring-1 ring-inset ring-[color-mix(in_srgb,var(--gold)_16%,transparent)] sm:p-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[brk.status]}>
            {brk.status === 'live' ? (
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400"
                  aria-hidden
                />
                {statusLabel}
              </span>
            ) : (
              statusLabel
            )}
          </Badge>
          <Badge tone="muted">{dict.sports[brk.sport]}</Badge>
          <Badge tone="muted">{breakTypeLabel[brk.breakType]}</Badge>
        </div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {brk.title}
        </h2>
        <p className="text-sm leading-relaxed text-muted">{brk.description}</p>
      </header>

      <dl className="flex flex-col gap-3 border-t border-white/10 pt-4 text-sm">
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            {dict.breaks.boxes}
          </dt>
          <dd className="text-ink">
            <ul className="flex flex-col gap-0.5">
              {brk.boxes.map((box, i) => (
                <li key={i}>{box}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              {dict.breaks.starts}
            </dt>
            <dd className="text-ink tabular-nums">
              {formatDate(brk.startsAt, locale)}
            </dd>
          </div>
          <dd className="text-sm font-medium text-gold">
            {availableCount} {dict.breaks.spotsAvailable}
          </dd>
        </div>
      </dl>

      <SpotGrid brk={brk} locale={locale} dict={dict} />
    </article>
  )
}
