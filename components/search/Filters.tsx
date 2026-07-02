'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { ProductFilter, Category, Sport, Availability } from '@/lib/data'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/getDictionary'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const CATEGORIES: Category[] = ['single', 'sealed', 'memorabilia', 'accessories']
const SPORTS: Sport[] = [
  'nba',
  'mlb',
  'nfl',
  'nhl',
  'pokemon',
  'soccer',
  'f1',
  'ufc',
  'onepiece',
  'mtg',
  'marvel',
]
const GRADES = ['PSA', 'BGS', 'SGC'] as const
const AVAILABILITY: Availability[] = ['in_stock', 'sold_out', 'preorder']
const SORTS = ['price_asc', 'price_desc', 'newest', 'value'] as const

const AVAILABILITY_LABEL: Record<Availability, keyof Dictionary['common']> = {
  in_stock: 'inStock',
  sold_out: 'soldOut',
  preorder: 'preorder',
}

// Sort labels reuse existing localized strings (no dedicated dict keys exist).
function sortLabel(sort: (typeof SORTS)[number], dict: Dictionary): string {
  switch (sort) {
    case 'price_asc':
      return `${dict.common.price} ↑`
    case 'price_desc':
      return `${dict.common.price} ↓`
    case 'newest':
      return dict.home.newArrivals
    case 'value':
      return dict.home.mostValuable
  }
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium uppercase tracking-[0.2em] text-muted"
      >
        {label}
      </label>
      {children}
    </div>
  )
}

export function Filters({
  locale,
  dict,
  value,
}: {
  locale: Locale
  dict: Dictionary
  value: ProductFilter
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  const [minPrice, setMinPrice] = useState(
    value.minPrice !== undefined ? String(value.minPrice) : ''
  )
  const [maxPrice, setMaxPrice] = useState(
    value.maxPrice !== undefined ? String(value.maxPrice) : ''
  )

  // Keep local price inputs in sync when the URL changes externally.
  useEffect(() => {
    setMinPrice(value.minPrice !== undefined ? String(value.minPrice) : '')
    setMaxPrice(value.maxPrice !== undefined ? String(value.maxPrice) : '')
  }, [value.minPrice, value.maxPrice])

  const pushParam = useCallback(
    (key: string, next: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next === undefined || next === '' || next === 'all') {
        params.delete(key)
      } else {
        params.set(key, next)
      }
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  // Debounce price inputs.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pushPriceDebounced = useCallback(
    (key: string, raw: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const trimmed = raw.trim()
        const num = Number(trimmed)
        pushParam(key, trimmed !== '' && Number.isFinite(num) && num >= 0 ? trimmed : undefined)
      }, 300)
    },
    [pushParam]
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function clearFilters() {
    router.push(`/${locale}/shop`, { scroll: false })
  }

  const panel = (
    <div className="flex flex-col gap-5 rounded-2xl border border-[color-mix(in_srgb,var(--gold)_20%,transparent)] bg-panel p-5">
      <Field label={dict.common.sort} htmlFor="filter-sort">
        <Select
          id="filter-sort"
          value={value.sort ?? ''}
          onChange={(e) => pushParam('sort', e.target.value)}
        >
          <option value="">{dict.common.all}</option>
          {SORTS.map((s) => (
            <option key={s} value={s}>
              {sortLabel(s, dict)}
            </option>
          ))}
        </Select>
      </Field>

      <div className="h-px bg-white/5" />

      <Field label={dict.nav.cards} htmlFor="filter-category">
        <Select
          id="filter-category"
          value={value.category ?? 'all'}
          onChange={(e) => pushParam('category', e.target.value)}
        >
          <option value="all">{dict.common.all}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {dict.categories[c]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={dict.common.sport} htmlFor="filter-sport">
        <Select
          id="filter-sport"
          value={value.sport ?? 'all'}
          onChange={(e) => pushParam('sport', e.target.value)}
        >
          <option value="all">{dict.common.all}</option>
          {SPORTS.map((s) => (
            <option key={s} value={s}>
              {dict.sports[s]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={dict.common.grade} htmlFor="filter-grade">
        <Select
          id="filter-grade"
          value={value.grade ?? 'all'}
          onChange={(e) => pushParam('grade', e.target.value)}
        >
          <option value="all">{dict.common.all}</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={dict.common.availability} htmlFor="filter-availability">
        <Select
          id="filter-availability"
          value={value.availability ?? 'all'}
          onChange={(e) => pushParam('availability', e.target.value)}
        >
          <option value="all">{dict.common.all}</option>
          {AVAILABILITY.map((a) => (
            <option key={a} value={a}>
              {dict.common[AVAILABILITY_LABEL[a]]}
            </option>
          ))}
        </Select>
      </Field>

      <div className="h-px bg-white/5" />

      <Field label={dict.common.price} htmlFor="filter-min-price">
        <div className="flex items-center gap-2">
          <Input
            id="filter-min-price"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            aria-label={`${dict.common.price} — min`}
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value)
              pushPriceDebounced('minPrice', e.target.value)
            }}
          />
          <span className="text-muted">–</span>
          <Input
            id="filter-max-price"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="∞"
            aria-label={`${dict.common.price} — max`}
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value)
              pushPriceDebounced('maxPrice', e.target.value)
            }}
          />
        </div>
      </Field>

      <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
        {dict.common.clearFilters}
      </Button>
    </div>
  )

  return (
    <div>
      {/* Mobile toggle */}
      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="md"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="filters-panel"
          className="w-full"
        >
          {dict.common.filters}
        </Button>
        <div id="filters-panel" hidden={!open} className="mt-4">
          {panel}
        </div>
      </div>

      {/* Desktop static sidebar */}
      <div className="hidden lg:block">{panel}</div>
    </div>
  )
}
