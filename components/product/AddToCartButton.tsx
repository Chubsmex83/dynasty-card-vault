'use client'

import { useEffect, useRef, useState } from 'react'
import type { Product } from '@/lib/data'
import type { Dictionary } from '@/i18n/getDictionary'
import { useCart } from '@/lib/cart/store'
import { Button } from '@/components/ui/Button'

export function AddToCartButton({
  product,
  dict,
}: {
  product: Product
  dict: Dictionary
}) {
  const soldOut = product.availability === 'sold_out'
  const [added, setAdded] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function handleAdd() {
    if (soldOut) return
    useCart.getState().addItem({
      id: product.id,
      kind: 'product',
      name: product.name,
      price: product.price,
    })
    setAdded(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setAdded(false), 1500)
  }

  return (
    <Button
      variant="gold"
      size="lg"
      onClick={handleAdd}
      disabled={soldOut}
      aria-live="polite"
      className="w-full sm:w-auto"
    >
      {soldOut
        ? dict.common.soldOut
        : added
          ? dict.product.addedToCart
          : dict.common.addToCart}
    </Button>
  )
}
