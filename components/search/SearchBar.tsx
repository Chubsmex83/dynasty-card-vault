'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { search, type Product } from '@/lib/data'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CardArt } from '@/components/product/CardArt'
import { Input } from '@/components/ui/Input'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/getDictionary'

export function SearchBar({
  locale,
  dict,
  className,
  onNavigate,
  autoFocus,
}: {
  locale: Locale
  dict: Dictionary
  className?: string
  onNavigate?: () => void
  autoFocus?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const listboxId = useId()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const rootRef = useRef<HTMLDivElement>(null)

  // Debounced live autocomplete (no module-scope timers).
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      return
    }
    const timer = setTimeout(() => {
      setResults(search(q, 8))
    }, 150)
    return () => clearTimeout(timer)
  }, [query])

  // Close on route change.
  useEffect(() => {
    setOpen(false)
    setActive(-1)
  }, [pathname])

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    function handlePointer(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        setActive(-1)
      }
    }
    document.addEventListener('pointerdown', handlePointer)
    return () => document.removeEventListener('pointerdown', handlePointer)
  }, [open])

  function goToProduct(product: Product) {
    setOpen(false)
    setActive(-1)
    onNavigate?.()
    router.push(`/${locale}/product/${product.slug}`)
  }

  function submitSearch() {
    const q = query.trim()
    if (!q) return
    setOpen(false)
    setActive(-1)
    onNavigate?.()
    router.push(`/${locale}/shop?q=${encodeURIComponent(q)}`)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (results.length === 0) return
      setOpen(true)
      setActive((prev) => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (results.length === 0) return
      setOpen(true)
      setActive((prev) => (prev <= 0 ? results.length - 1 : prev - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (open && active >= 0 && active < results.length) {
        goToProduct(results[active])
      } else {
        submitSearch()
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  const showPanel = open && query.trim().length > 0 && results.length > 0
  const activeId = active >= 0 ? `${listboxId}-opt-${active}` : undefined

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        >
          <SearchIcon />
        </span>
        <Input
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder={dict.nav.searchPlaceholder}
          value={query}
          className="pl-11"
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActive(-1)
          }}
          onFocus={() => {
            if (query.trim() && results.length > 0) setOpen(true)
          }}
          onKeyDown={handleKeyDown}
        />
      </div>

      {showPanel ? (
        <ul
          id={listboxId}
          role="listbox"
          className={cn(
            'absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-gold/25 bg-panel-2/95 p-1.5 shadow-2xl backdrop-blur-md'
          )}
        >
          {results.map((product, index) => {
            const isActive = index === active
            return (
              <li key={product.id} role="presentation">
                <Link
                  id={`${listboxId}-opt-${index}`}
                  role="option"
                  aria-selected={isActive}
                  href={`/${locale}/product/${product.slug}`}
                  onClick={() => {
                    setOpen(false)
                    onNavigate?.()
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-2 py-2 transition-colors',
                    isActive ? 'bg-gold/10' : 'hover:bg-white/5'
                  )}
                >
                  <span className="w-10 shrink-0">
                    <CardArt product={product} size="grid" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">
                      {product.name}
                    </span>
                    {product.brand || product.year ? (
                      <span className="block truncate text-xs text-muted">
                        {[product.brand, product.year].filter(Boolean).join(' · ')}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 font-display text-sm tabular-nums text-gold-soft">
                    {formatPrice(product.price, locale)}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
