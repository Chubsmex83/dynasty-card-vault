import { NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/checkout/paypal'

export async function POST(req: Request) {
  try {
    const { orderId } = (await req.json()) as { orderId: string }
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }
    const { status } = await capturePayPalOrder(orderId)
    return NextResponse.json({ status })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Capture failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
