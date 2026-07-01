import { it, expect, beforeEach } from 'vitest'
import { useCart, cartCount, cartTotal } from '@/lib/cart/store'
beforeEach(()=> useCart.getState().clear())
it('adds and increments', () => {
  const { addItem } = useCart.getState()
  addItem({ id:'p1', kind:'product', name:'X', price:100 })
  addItem({ id:'p1', kind:'product', name:'X', price:100 })
  expect(cartCount(useCart.getState())).toBe(2)
  expect(cartTotal(useCart.getState())).toBe(200)
})
it('removes and sets qty', () => {
  const { addItem, setQty, removeItem } = useCart.getState()
  addItem({ id:'p2', kind:'product', name:'Y', price:50 })
  setQty('p2', 3); expect(cartTotal(useCart.getState())).toBe(150)
  removeItem('p2'); expect(cartCount(useCart.getState())).toBe(0)
})
