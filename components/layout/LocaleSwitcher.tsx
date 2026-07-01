'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { locales, type Locale } from '@/i18n/config'
import { cn } from '@/lib/utils'

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function pathForLocale(target: Locale): string {
    const segments = (pathname ?? '/').split('/')
    // segments[0] === '' , segments[1] === current locale segment
    if (segments.length > 1 && (locales as readonly string[]).includes(segments[1])) {
      segments[1] = target
    } else {
      segments.splice(1, 0, target)
    }
    const base = segments.join('/') || `/${target}`
    const qs = searchParams?.toString()
    return qs ? `${base}?${qs}` : base
  }

  return (
    <div
      className="inline-flex items-center rounded-full border border-gold/25 bg-panel-2/60 p-0.5 text-xs font-medium"
      role="group"
      aria-label="Language"
    >
      {locales.map((l) => {
        const isCurrent = l === locale
        return (
          <Link
            key={l}
            href={pathForLocale(l)}
            aria-current={isCurrent ? 'true' : undefined}
            className={cn(
              'rounded-full px-2.5 py-1 uppercase tracking-[0.1em] transition-colors',
              isCurrent
                ? 'bg-gold text-bg'
                : 'text-muted hover:text-ink'
            )}
          >
            {l}
          </Link>
        )
      })}
    </div>
  )
}
