import { NextResponse } from 'next/server'
import { resolveCharge, type CartLine } from '@/lib/checkout/resolveCharge'
import { createPayPalOrder } from '@/lib/checkout/paypal'
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
    if (charge.currency !== 'USD') {
      return NextResponse.json(
        { error: 'PayPal checkout is USD-only; use Stripe for MXN' },
        { status: 400 }
      )
    }
    const { orderId } = await createPayPalOrder(charge)
    return NextResponse.json({ orderId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
