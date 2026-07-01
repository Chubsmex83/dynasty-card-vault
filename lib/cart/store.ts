import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type CartItem = {
  id: string
  kind: 'product' | 'spot'
  name: string
  price: number
  qty: number
  meta?: Record<string, string>
}

type CartState = {
  items: CartItem[]
  addItem: (entry: Omit<CartItem, 'qty'> & { qty?: number }) => void
  removeItem: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (entry) =>
        set((state) => {
          const qtyToAdd = entry.qty ?? 1
          const existing = state.items.find((i) => i.id === entry.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === entry.id ? { ...i, qty: i.qty + qtyToAdd } : i
              ),
            }
          }
          return {
            items: [...state.items, { ...entry, qty: qtyToAdd }],
          }
        }),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, qty: Math.max(1, qty) } : i
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'dcv-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export function cartCount(state: CartState): number {
  return state.items.reduce((sum, i) => sum + i.qty, 0)
}

export function cartTotal(state: CartState): number {
  return state.items.reduce((sum, i) => sum + i.price * i.qty, 0)
}
