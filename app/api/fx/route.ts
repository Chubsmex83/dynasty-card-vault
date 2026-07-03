import { NextResponse } from 'next/server'
import { getFixRate, getUsdMargin } from '@/lib/fx/banxico'

/**
 * Current FIX exchange rate + configured margin.
 *
 * Reads the daily-cached Banxico value (see lib/fx/banxico.ts). Useful for
 * debugging and as a lightweight health check; the daily Vercel cron will hit
 * this to keep the 24h data cache warm.
 */
export async function GET() {
  const rate = await getFixRate()
  return NextResponse.json({
    ...rate,
    margin: getUsdMargin(),
  })
}
