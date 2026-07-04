import 'server-only'
import Stripe from 'stripe'
import type { ResolvedCharge } from './resolveCharge'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')

/**
 * Create a Stripe Checkout Session (redirect flow) for an MXN charge. Amounts go
 * to Stripe in the smallest unit (centavos). Cards, Apple/Google Pay and Meses
 * Sin Intereses are enabled from the Stripe dashboard and appear automatically.
 */
export async function createStripeSession(
  charge: ResolvedCharge,
  urls: { successUrl: string; cancelUrl: string }
): Promise<{ id: string; url: string }> {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: charge.lineItems.map((li) => ({
      quantity: li.qty,
      price_data: {
        currency: 'mxn',
        unit_amount: Math.round(li.unitAmount * 100),
        product_data: { name: li.name },
      },
    })),
    success_url: urls.successUrl,
    cancel_url: urls.cancelUrl,
  })
  if (!session.url) throw new Error('Stripe did not return a Checkout URL')
  return { id: session.id, url: session.url }
}
