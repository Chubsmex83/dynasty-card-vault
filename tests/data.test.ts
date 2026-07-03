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

import { getProductById, getSpotById } from '@/lib/data'
import { products } from '@/lib/data/products'
import { breaks } from '@/lib/data/breaks'

describe('getProductById', () => {
  it('encuentra un producto por su id', () => {
    const sample = products[0]
    expect(getProductById(sample.id)?.id).toBe(sample.id)
  })
  it('devuelve undefined para un id inexistente', () => {
    expect(getProductById('no-existe')).toBeUndefined()
  })
})

describe('getSpotById', () => {
  it('encuentra un spot con el id compuesto "<breakId>:<spotId>"', () => {
    const brk = breaks[0]
    const spot = brk.spots[0]
    const found = getSpotById(`${brk.id}:${spot.id}`)
    expect(found?.id).toBe(spot.id)
    expect(found?.price).toBe(spot.price)
  })
  it('devuelve undefined si el break o el spot no existen', () => {
    expect(getSpotById('b-000:no-existe')).toBeUndefined()
    expect(getSpotById('sin-dos-puntos')).toBeUndefined()
  })
})
