import { describe, it, expect } from 'vitest'
import { getProducts, getProductBySlug, getFeatured, getBreaks } from '@/lib/data'
describe('data layer', () => {
  it('returns a non-trivial catalog', () => {
    expect(getProducts().length).toBeGreaterThanOrEqual(60)
  })
  it('filters by category and sport', () => {
    const r = getProducts({ category:'single', sport:'nba' })
    expect(r.every(p => p.category==='single' && p.sport==='nba')).toBe(true)
  })
  it('filters by price range', () => {
    const r = getProducts({ minPrice:100, maxPrice:500 })
    expect(r.every(p => p.price>=100 && p.price<=500)).toBe(true)
  })
  it('sorts by price ascending', () => {
    const r = getProducts({ sort:'price_asc' })
    for (let i=1;i<r.length;i++) expect(r[i].price).toBeGreaterThanOrEqual(r[i-1].price)
  })
  it('looks up by slug', () => {
    const first = getProducts()[0]
    expect(getProductBySlug(first.slug)?.id).toBe(first.id)
  })
  it('featured and breaks are populated', () => {
    expect(getFeatured().length).toBeGreaterThan(0)
    expect(getBreaks().length).toBeGreaterThan(0)
  })
  it('has unique slugs', () => {
    const slugs = getProducts().map(p=>p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})
