import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('relative overflow-hidden rounded-xl bg-panel-2', className)}
    >
      <div
        className="absolute inset-0 -translate-x-full motion-reduce:hidden"
        style={{
          background:
            'linear-gradient(90deg, transparent, color-mix(in srgb, var(--ink) 6%, transparent), transparent)',
          animation: 'shimmer 1.6s infinite',
        }}
      />
    </div>
  )
}
