import { NextResponse } from 'next/server'
import { resolveCharge, type CartLine } from '@/lib/checkout/resolveCharge'
import { createStripeSession } from '@/lib/checkout/stripe'
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
    if (charge.currency !== 'MXN') {
      return NextResponse.json(
        { error: 'Stripe checkout is MXN-only; use PayPal for USD' },
        { status: 400 }
      )
    }
    const origin = new URL(req.url).origin
    const session = await createStripeSession(charge, {
      successUrl: `${origin}/${loc}/checkout/success?provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/${loc}/checkout`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
