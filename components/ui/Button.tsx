import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'gold' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-tight transition-all duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg ' +
  'disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px'

const variants: Record<ButtonVariant, string> = {
  // gold-tinted solid on dark
  primary:
    'bg-[color-mix(in_srgb,var(--gold)_16%,var(--panel-2))] text-ink ring-1 ring-inset ring-[color-mix(in_srgb,var(--gold)_40%,transparent)] hover:bg-[color-mix(in_srgb,var(--gold)_26%,var(--panel-2))] hover:-translate-y-0.5',
  // gold fill with dark text
  gold: 'bg-gold text-bg hover:bg-gold-soft hover:-translate-y-0.5 shadow-[0_6px_20px_-8px_color-mix(in_srgb,var(--gold)_70%,transparent)]',
  // transparent with gold hairline border
  ghost:
    'bg-transparent text-ink ring-1 ring-inset ring-[color-mix(in_srgb,var(--gold)_35%,transparent)] hover:bg-[color-mix(in_srgb,var(--gold)_10%,transparent)] hover:text-gold-soft',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-sm',
  lg: 'h-13 px-8 text-base',
}

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return cn(base, variants[variant], sizes[size])
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  return <button type={type} className={cn(buttonClasses(variant, size), className)} {...props} />
}
