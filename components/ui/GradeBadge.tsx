import type { Grade } from '@/lib/data'
import { cn } from '@/lib/utils'

export function GradeBadge({ grade, className }: { grade: Grade; className?: string }) {
  const gemMint = grade.value >= 9.5
  const value = Number.isInteger(grade.value) ? String(grade.value) : grade.value.toFixed(1)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold uppercase leading-none tracking-[0.12em]',
        gemMint
          ? 'holo-border holo-text bg-[color-mix(in_srgb,var(--panel-2)_85%,transparent)]'
          : 'text-gold ring-1 ring-inset ring-[color-mix(in_srgb,var(--gold)_45%,transparent)] bg-[color-mix(in_srgb,var(--gold)_8%,transparent)]',
        className
      )}
    >
      <span className="font-display">{grade.company}</span>
      <span className="font-display tabular-nums">{value}</span>
    </span>
  )
}
