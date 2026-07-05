import { describe, it, expect } from 'vitest'
import { resolveCharge, type CartLine } from '@/lib/checkout/resolveCharge'
import { products } from '@/lib/data/products'
import { breaks } from '@/lib/data/breaks'

const fx = { fix: 17.5, margin: 0.05 }
const prod = products[0]
const brk = breaks[0]
const spot = brk.spots[0]

describe('resolveCharge', () => {
  it('es → MXN usando el precio base tal cual', () => {
    const items: CartLine[] = [{ id: prod.id, kind: 'product', qty: 2 }]
    const charge = resolveCharge(items, 'es', fx)
    expect(charge.currency).toBe('MXN')
    expect(charge.lineItems[0].unitAmount).toBe(prod.price)
    expect(charge.total).toBe(prod.price * 2)
  })

  it('en → USD convertido con (base/fix)*(1+margin), al centavo', () => {
    const items: CartLine[] = [{ id: prod.id, kind: 'product', qty: 1 }]
    const charge = resolveCharge(items, 'en', fx)
    const expected = Math.round((prod.price / 17.5) * 1.05 * 100) / 100
    expect(charge.currency).toBe('USD')
    expect(charge.lineItems[0].unitAmount).toBe(expected)
    expect(charge.total).toBe(expected)
  })

  it('resuelve spots de Live Breaks por su id compuesto', () => {
    const items: CartLine[] = [{ id: `${brk.id}:${spot.id}`, kind: 'spot', qty: 1 }]
    const charge = resolveCharge(items, 'es', fx)
    expect(charge.lineItems[0].unitAmount).toBe(spot.price)
  })

  it('el total es la suma de líneas (importe unitario × cantidad)', () => {
    const items: CartLine[] = [
      { id: prod.id, kind: 'product', qty: 2 },
      { id: `${brk.id}:${spot.id}`, kind: 'spot', qty: 1 },
    ]
    const charge = resolveCharge(items, 'es', fx)
    expect(charge.total).toBe(prod.price * 2 + spot.price)
  })

  it('lanza si un id no existe', () => {
    expect(() =>
      resolveCharge([{ id: 'no-existe', kind: 'product', qty: 1 }], 'es', fx)
    ).toThrow(/Unknown cart item/)
  })

  it('lanza si qty es negativa', () => {
    expect(() =>
      resolveCharge([{ id: prod.id, kind: 'product', qty: -1 }], 'es', fx)
    ).toThrow(/Invalid quantity/)
  })

  it('lanza si qty es cero', () => {
    expect(() =>
      resolveCharge([{ id: prod.id, kind: 'product', qty: 0 }], 'es', fx)
    ).toThrow(/Invalid quantity/)
  })

  it('lanza si qty no es entero', () => {
    expect(() =>
      resolveCharge([{ id: prod.id, kind: 'product', qty: 1.5 }], 'es', fx)
    ).toThrow(/Invalid quantity/)
  })

  it('rechaza un carrito mixto con qty negativa que subvalúa el total', () => {
    const items: CartLine[] = [
      { id: prod.id, kind: 'product', qty: 1 },
      { id: `${brk.id}:${spot.id}`, kind: 'spot', qty: -1 },
    ]
    expect(() => resolveCharge(items, 'es', fx)).toThrow(/Invalid quantity/)
  })
})
