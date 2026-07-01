import { it, expect } from 'vitest'
import { formatPrice } from '@/lib/format'
it('formats USD', () => { expect(formatPrice(1200,'en')).toMatch(/\$1,200/) })
