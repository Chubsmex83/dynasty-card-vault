import { formatPrice } from '@/lib/format'
import type { Locale } from '@/i18n/config'
import { cn } from '@/lib/utils'

export function PriceTag({
  value,
  locale,
  className,
}: {
  value: number
  locale: Locale
  className?: string
}) {
  return (
    <span
      className={cn(
        'font-display text-lg font-semibold tracking-tight tabular-nums text-ink',
        className
      )}
    >
      {formatPrice(value, locale)}
    </span>
  )
}
