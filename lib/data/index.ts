import { products } from './products'
import { breaks } from './breaks'
import type { Product, ProductFilter, Break } from './types'

export * from './types'

export function getProducts(filter: ProductFilter = {}): Product[] {
  let result = products.slice()

  if (filter.category) result = result.filter((p) => p.category === filter.category)
  if (filter.sport) result = result.filter((p) => p.sport === filter.sport)
  if (filter.grade) result = result.filter((p) => p.grade?.company === filter.grade)
  if (filter.availability) result = result.filter((p) => p.availability === filter.availability)
  if (filter.minPrice !== undefined) result = result.filter((p) => p.price >= filter.minPrice!)
  if (filter.maxPrice !== undefined) result = result.filter((p) => p.price <= filter.maxPrice!)

  switch (filter.sort) {
    case 'price_asc':
      result.sort((a, b) => a.price - b.price)
      break
    case 'price_desc':
      result.sort((a, b) => b.price - a.price)
      break
    case 'newest':
      result = [
        ...result.filter((p) => p.newArrival),
        ...result.filter((p) => !p.newArrival),
      ]
      break
    case 'value':
      result.sort((a, b) => (b.valuation ?? b.price) - (a.valuation ?? a.price))
      break
    default:
      break
  }

  return result
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug)
}

export function getFeatured(): Product[] {
  return products.filter((p) => p.featured === true)
}

export function getNewArrivals(): Product[] {
  return products.filter((p) => p.newArrival === true)
}

export function getMostValuable(): Product[] {
  return products
    .slice()
    .sort((a, b) => (b.valuation ?? b.price) - (a.valuation ?? a.price))
    .slice(0, 8)
}

export function getRelated(product: Product, n = 4): Product[] {
  return products
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.sport === product.sport || p.category === product.category)
    )
    .slice(0, n)
}

export function getBreaks(): Break[] {
  return breaks.slice()
}

export function getBreakBySlug(slug: string): Break | undefined {
  return breaks.find((b) => b.slug === slug)
}

export function search(query: string, limit = 8): Product[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  return products
    .filter((p) => {
      const haystack = [
        p.name,
        p.player,
        p.team,
        p.league,
        p.brand,
        p.cardNumber,
        p.year !== undefined ? String(p.year) : undefined,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
    .slice(0, limit)
}
