import 'server-only'
import type { ResolvedCharge } from './resolveCharge'

const BASE =
  process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

async function accessToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID ?? ''
  const secret = process.env.PAYPAL_CLIENT_SECRET ?? ''
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`)
  const json = (await res.json()) as { access_token: string }
  return json.access_token
}

/** Create a PayPal order for a USD charge. Single amount = charge.total. */
export async function createPayPalOrder(
  charge: ResolvedCharge
): Promise<{ orderId: string }> {
  const token = await accessToken()
  const res = await fetch(`${BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: charge.total.toFixed(2),
          },
        },
      ],
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`PayPal create order failed: ${res.status}`)
  const json = (await res.json()) as { id: string }
  return { orderId: json.id }
}

/** Capture an approved PayPal order server-side (authoritative confirmation). */
export async function capturePayPalOrder(
  orderId: string
): Promise<{ status: string }> {
  const token = await accessToken()
  const res = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`PayPal capture failed: ${res.status}`)
  const json = (await res.json()) as { status: string }
  return { status: json.status }
}
