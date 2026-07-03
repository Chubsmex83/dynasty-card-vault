import 'server-only'

/**
 * Banxico FIX exchange-rate service (Phase 2).
 *
 * Base prices are stored in MXN; the English store shows USD derived from the
 * daily FIX rate published by Banco de México (SIE series SF43718):
 *
 *   USD = (MXN / FIX) * (1 + USD_MARGIN)
 *
 * The rate is fetched at most once per day (Next data cache, 24h revalidate)
 * so we never hammer the Banxico API on every page load. If the API is
 * unavailable, or on days it doesn't publish (Banxico's "oportuno" endpoint
 * already returns the last published value on weekends/holidays), we fall back
 * to the last safe value so the USD price is never missing.
 */

// SIE series id for "Tipo de cambio FIX" (pesos per USD).
const FIX_SERIES = 'SF43718'
const ENDPOINT = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${FIX_SERIES}/datos/oportuno`

// Last-resort value if we have never reached Banxico (approx. mid-2026 FIX).
// Kept intentionally conservative; the live value overrides it within a day.
const FALLBACK_FIX = 17.5

const ONE_DAY_SECONDS = 60 * 60 * 24

export type FxRate = {
  /** Pesos per USD (FIX). */
  fix: number
  /** Publication date reported by Banxico (dd/mm/yyyy), or null when unknown. */
  asOf: string | null
  /** Where the value came from — useful for debugging/monitoring. */
  source: 'banxico' | 'fallback'
}

/** USD conversion margin (buffer for FX drift + fees). Configurable via env. */
export function getUsdMargin(): number {
  const raw = Number(process.env.USD_MARGIN)
  return Number.isFinite(raw) && raw >= 0 ? raw : 0.05
}

/**
 * Current FIX rate, cached for 24h. Never throws — always resolves to a usable
 * rate (falling back to the last safe value when Banxico can't be reached).
 */
export async function getFixRate(): Promise<FxRate> {
  const token = process.env.BANXICO_TOKEN
  if (!token) {
    return { fix: FALLBACK_FIX, asOf: null, source: 'fallback' }
  }

  try {
    const res = await fetch(`${ENDPOINT}?token=${token}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: ONE_DAY_SECONDS, tags: ['fx-rate'] },
    })
    if (!res.ok) throw new Error(`Banxico responded ${res.status}`)

    const json = (await res.json()) as {
      bmx?: { series?: Array<{ datos?: Array<{ fecha: string; dato: string }> }> }
    }
    const point = json.bmx?.series?.[0]?.datos?.[0]
    const fix = point ? Number(point.dato) : NaN

    if (!Number.isFinite(fix) || fix <= 0) throw new Error('Banxico returned no usable value')

    return { fix, asOf: point!.fecha ?? null, source: 'banxico' }
  } catch {
    // Swallow and fall back — the store must never be left without a USD price.
    return { fix: FALLBACK_FIX, asOf: null, source: 'fallback' }
  }
}
