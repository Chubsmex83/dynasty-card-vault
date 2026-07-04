import { NextResponse } from 'next/server'
import { resolveCharge, type CartLine } from '@/lib/checkout/resolveCharge'
import { getFixRate, getUsdMargin } from '@/lib/fx/banxico'

export async function POST(req: Request) {
  try {
    const { items, locale } = (await req.json()) as {
      items: CartLine[]
      locale: 'es' | 'en'
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Empty cart' }, { status: 400 })
    }
    const loc = locale === 'en' ? 'en' : 'es'
    const { fix } = await getFixRate()
    const charge = resolveCharge(items, loc, { fix, margin: getUsdMargin() })
    return NextResponse.json(charge)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bad request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
