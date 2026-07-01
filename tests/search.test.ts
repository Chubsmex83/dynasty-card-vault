import { it, expect } from 'vitest'
import { search } from '@/lib/data'
it('finds by player name case-insensitively', () => {
  const r = search('lebron')
  expect(r.some(p => /lebron/i.test(p.name + (p.player ?? '')))).toBe(true)
})
it('respects limit', () => { expect(search('a', 5).length).toBeLessThanOrEqual(5) })
it('empty query returns nothing', () => { expect(search('   ').length).toBe(0) })
