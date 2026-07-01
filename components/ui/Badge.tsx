import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type BadgeTone = 'gold' | 'muted' | 'holo' | 'green' | 'red'

const base =
  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-[0.16em] leading-none'

const tones: Record<BadgeTone, string> = {
  gold: 'text-gold ring-1 ring-inset ring-[color-mix(in_srgb,var(--gold)_40%,transparent)] bg-[color-mix(in_srgb,var(--gold)_8%,transparent)]',
  muted: 'text-muted ring-1 ring-inset ring-white/10 bg-white/5',
  holo: 'holo-border holo-text bg-[color-mix(in_srgb,var(--panel-2)_80%,transparent)]',
  green:
    'text-emerald-300 ring-1 ring-inset ring-emerald-400/30 bg-emerald-400/10',
  red: 'text-rose-300 ring-1 ring-inset ring-rose-400/30 bg-rose-400/10',
}

export function Badge({
  children,
  tone = 'muted',
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return <span className={cn(base, tones[tone], className)}>{children}</span>
}
