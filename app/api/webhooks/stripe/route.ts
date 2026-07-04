import { NextResponse } from 'next/server'
import { stripe } from '@/lib/checkout/stripe'

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !secret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const body = await req.text() // raw body required for signature verification
  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    // Authoritative server-side confirmation. Order fulfillment / persistence
    // plugs in here when storage lands (OXXO-pending + durable orders).
    console.info('[stripe] checkout.session.completed', event.id)
  }

  return NextResponse.json({ received: true })
}
