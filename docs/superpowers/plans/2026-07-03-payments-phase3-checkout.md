# Fase 3 — Checkout sandbox end-to-end Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Desde el carrito existente, un cliente puede pagar en sandbox (ES→Stripe/MXN, EN→PayPal/USD) y ver una confirmación, con el importe resuelto y validado del lado del servidor.

**Architecture:** Un módulo puro `resolveCharge(items, locale, {fix, margin})` es la única fuente de verdad del importe+moneda; el cliente solo manda IDs+cantidades. Las rutas API server-side re-resuelven el importe y hablan con Stripe (redirect Checkout, MXN) o PayPal (JS SDK + captura server-side, USD). La página de checkout es un client component que lee el carrito, pide una cotización al servidor y muestra el botón de pago según el locale.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Zustand (carrito), `stripe` (Node SDK), `@paypal/react-paypal-js` (botones), Vitest (pruebas). FX vía `lib/fx/banxico.ts` (Banxico FIX, ya existente).

## Global Constraints

- **Windows/Next:** correr `next`/`vitest` desde una ruta cuyo `Desktop` tenga la misma mayúscula que el filesystem (`C:/Users/.../Desktop/...`); si no, webpack carga dos copias de React y el build falla. La build de Vercel (Linux) no se ve afectada.
- **Secretos solo en servidor:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYPAL_CLIENT_SECRET` nunca se exponen al cliente. `PAYPAL_CLIENT_ID` es publicable (client-id de PayPal) y se pasa como prop desde un server component. `.env*` está gitignored (salvo `.env.example`).
- **Nunca cobrar con base en importes del cliente:** el cliente envía `{ id, kind, qty }`; el servidor re-resuelve el precio desde `lib/data/`.
- **Sandbox primero:** `PAYPAL_ENV=sandbox`; llaves Stripe `sk_test_`/`pk_test_`. No tocar producción.
- **Consistencia mostrado-vs-cobrado:** el mismo `resolveCharge` alimenta la cotización mostrada y el importe cobrado. Ningún cálculo de precio duplicado fuera de él.
- **Moneda por locale:** `es`→MXN, `en`→USD. Una pasarela por moneda: MXN→Stripe, USD→PayPal.
- **Import style de tests:** `import { describe, it, expect } from 'vitest'`; alias `@` = raíz del repo. Tests en `tests/*.test.ts`. Comando: `npm run test`.
- **Interino de precios MXN:** hasta que llegue la lista del cliente, `resolveCharge` trata el número `price` actual del catálogo como si fuera el precio base en MXN (placeholder deliberado). Cuando llegue la lista, se cambia solo la lectura del precio base.

---

### Task 1: Accesores de catálogo por id (producto y spot)

`resolveCharge` busca cada línea del carrito por su id. El carrito guarda `id: product.id` para productos y `id: "<breakId>:<spotId>"` para spots (ver `components/breaks/SpotGrid.tsx:24`). Hoy `lib/data/index.ts` solo expone búsqueda por slug. Agregamos dos accesores por id.

**Files:**
- Modify: `lib/data/index.ts` (agregar `getProductById`, `getSpotById`)
- Test: `tests/data.test.ts` (agregar casos)

**Interfaces:**
- Consumes: `products`, `breaks` (ya importados en `index.ts`); tipos `Product`, `Spot` de `./types`.
- Produces:
  - `getProductById(id: string): Product | undefined`
  - `getSpotById(cartId: string): Spot | undefined` — `cartId` con formato `"<breakId>:<spotId>"`.

- [ ] **Step 1: Escribir el test que falla**

Agregar al final de `tests/data.test.ts`:

```ts
import { getProductById, getSpotById } from '@/lib/data'
import { products } from '@/lib/data/products'
import { breaks } from '@/lib/data/breaks'

describe('getProductById', () => {
  it('encuentra un producto por su id', () => {
    const sample = products[0]
    expect(getProductById(sample.id)?.id).toBe(sample.id)
  })
  it('devuelve undefined para un id inexistente', () => {
    expect(getProductById('no-existe')).toBeUndefined()
  })
})

describe('getSpotById', () => {
  it('encuentra un spot con el id compuesto "<breakId>:<spotId>"', () => {
    const brk = breaks[0]
    const spot = brk.spots[0]
    const found = getSpotById(`${brk.id}:${spot.id}`)
    expect(found?.id).toBe(spot.id)
    expect(found?.price).toBe(spot.price)
  })
  it('devuelve undefined si el break o el spot no existen', () => {
    expect(getSpotById('b-000:no-existe')).toBeUndefined()
    expect(getSpotById('sin-dos-puntos')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npm run test -- tests/data.test.ts`
Expected: FAIL — `getProductById`/`getSpotById` no exportados.

- [ ] **Step 3: Implementar los accesores**

Agregar en `lib/data/index.ts` (después de `getProductBySlug`, ~línea 42):

```ts
export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}

export function getSpotById(cartId: string): Spot | undefined {
  const [breakId, spotId] = cartId.split(':')
  if (!breakId || !spotId) return undefined
  const brk = breaks.find((b) => b.id === breakId)
  return brk?.spots.find((s) => s.id === spotId)
}
```

Asegurar que `Spot` esté disponible: `index.ts` ya hace `export * from './types'`, así que `import type { Product, ProductFilter, Break }` en la línea 3 debe ampliarse a incluir `Spot`:

```ts
import type { Product, ProductFilter, Break, Spot } from './types'
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npm run test -- tests/data.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/data/index.ts tests/data.test.ts
git commit -m "feat(checkout): catalog lookups by id for products and spots"
```

---

### Task 2: `resolveCharge` — fuente de verdad de importe+moneda

Función pura (sin `server-only`, testeable en vitest). Recibe `fix`+`margin` inyectados por el caller (patrón de `lib/money.ts`).

**Files:**
- Create: `lib/checkout/resolveCharge.ts`
- Test: `tests/resolveCharge.test.ts`

**Interfaces:**
- Consumes: `getProductById`, `getSpotById` (Task 1); `mxnToUsd` de `@/lib/money`; `Locale` de `@/i18n/config`.
- Produces:
  - `type CartLine = { id: string; kind: 'product' | 'spot'; qty: number }`
  - `type ChargeLineItem = { id: string; name: string; unitAmount: number; qty: number }`
  - `type ResolvedCharge = { currency: 'MXN' | 'USD'; lineItems: ChargeLineItem[]; total: number }`
  - `resolveCharge(items: CartLine[], locale: Locale, fx: { fix: number; margin: number }): ResolvedCharge`
  - Lanza `Error('Unknown cart item: <id>')` si un id no resuelve.

- [ ] **Step 1: Escribir el test que falla**

Create `tests/resolveCharge.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { resolveCharge, type CartLine } from '@/lib/checkout/resolveCharge'
import { products } from '@/lib/data/products'
import { breaks } from '@/lib/data/breaks'

const fx = { fix: 17.5, margin: 0.05 }
const prod = products[0]
const brk = breaks[0]
const spot = brk.spots[0]

describe('resolveCharge', () => {
  it('es → MXN usando el precio base tal cual', () => {
    const items: CartLine[] = [{ id: prod.id, kind: 'product', qty: 2 }]
    const charge = resolveCharge(items, 'es', fx)
    expect(charge.currency).toBe('MXN')
    expect(charge.lineItems[0].unitAmount).toBe(prod.price)
    expect(charge.total).toBe(prod.price * 2)
  })

  it('en → USD convertido con (base/fix)*(1+margin), al centavo', () => {
    const items: CartLine[] = [{ id: prod.id, kind: 'product', qty: 1 }]
    const charge = resolveCharge(items, 'en', fx)
    const expected = Math.round((prod.price / 17.5) * 1.05 * 100) / 100
    expect(charge.currency).toBe('USD')
    expect(charge.lineItems[0].unitAmount).toBe(expected)
    expect(charge.total).toBe(expected)
  })

  it('resuelve spots de Live Breaks por su id compuesto', () => {
    const items: CartLine[] = [{ id: `${brk.id}:${spot.id}`, kind: 'spot', qty: 1 }]
    const charge = resolveCharge(items, 'es', fx)
    expect(charge.lineItems[0].unitAmount).toBe(spot.price)
  })

  it('el total es la suma de líneas (importe unitario × cantidad)', () => {
    const items: CartLine[] = [
      { id: prod.id, kind: 'product', qty: 2 },
      { id: `${brk.id}:${spot.id}`, kind: 'spot', qty: 1 },
    ]
    const charge = resolveCharge(items, 'es', fx)
    expect(charge.total).toBe(prod.price * 2 + spot.price)
  })

  it('lanza si un id no existe', () => {
    expect(() =>
      resolveCharge([{ id: 'no-existe', kind: 'product', qty: 1 }], 'es', fx)
    ).toThrow(/Unknown cart item/)
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npm run test -- tests/resolveCharge.test.ts`
Expected: FAIL — módulo `resolveCharge` no existe.

- [ ] **Step 3: Implementar `resolveCharge`**

Create `lib/checkout/resolveCharge.ts`:

```ts
import type { Locale } from '@/i18n/config'
import { getProductById, getSpotById } from '@/lib/data'
import { mxnToUsd } from '@/lib/money'

/**
 * Checkout charge resolver (Phase 3). Pure and server-safe — no I/O, no secrets.
 *
 * The single source of truth for what gets charged. The client sends only ids +
 * quantities; this function looks up the authoritative base price from the
 * catalog and returns the amount and currency for the given locale. Feeding both
 * the displayed quote and the amount sent to the gateway through this one
 * function guarantees the shown price equals the charged price.
 *
 * Interim: the catalog's numeric `price` is treated as the MXN base price until
 * the client's final MXN price list lands (then only the base-price read below
 * changes).
 */

export type CartLine = { id: string; kind: 'product' | 'spot'; qty: number }
export type ChargeLineItem = {
  id: string
  name: string
  unitAmount: number
  qty: number
}
export type ResolvedCharge = {
  currency: 'MXN' | 'USD'
  lineItems: ChargeLineItem[]
  total: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

function basePrice(item: CartLine): { name: string; mxn: number } {
  if (item.kind === 'product') {
    const p = getProductById(item.id)
    if (!p) throw new Error(`Unknown cart item: ${item.id}`)
    return { name: p.name, mxn: p.price }
  }
  const spot = getSpotById(item.id)
  if (!spot) throw new Error(`Unknown cart item: ${item.id}`)
  return { name: spot.label, mxn: spot.price }
}

export function resolveCharge(
  items: CartLine[],
  locale: Locale,
  fx: { fix: number; margin: number }
): ResolvedCharge {
  const currency = locale === 'en' ? 'USD' : 'MXN'

  const lineItems: ChargeLineItem[] = items.map((item) => {
    const { name, mxn } = basePrice(item)
    const unitAmount =
      currency === 'USD' ? mxnToUsd(mxn, fx.fix, fx.margin) : mxn
    return { id: item.id, name, unitAmount, qty: item.qty }
  })

  const total = round2(
    lineItems.reduce((sum, li) => sum + li.unitAmount * li.qty, 0)
  )

  return { currency, lineItems, total }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npm run test -- tests/resolveCharge.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/checkout/resolveCharge.ts tests/resolveCharge.test.ts
git commit -m "feat(checkout): resolveCharge as single source of truth for amount+currency"
```

---

### Task 3: Cliente Stripe + dependencia

Cliente server-only que crea una Checkout Session en MXN por redirect. Instala el SDK oficial.

**Files:**
- Modify: `package.json` (dependencia `stripe`)
- Create: `lib/checkout/stripe.ts`

**Interfaces:**
- Consumes: `ResolvedCharge` (Task 2); env `STRIPE_SECRET_KEY`.
- Produces:
  - `createStripeSession(charge: ResolvedCharge, urls: { successUrl: string; cancelUrl: string }): Promise<{ id: string; url: string }>`

- [ ] **Step 1: Instalar el SDK de Stripe**

Run: `npm install stripe`
Expected: `stripe` aparece en `dependencies` de `package.json`; sin errores.

- [ ] **Step 2: Implementar el cliente Stripe**

Create `lib/checkout/stripe.ts`:

```ts
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
```

- [ ] **Step 3: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores de tipos en `lib/checkout/stripe.ts`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json lib/checkout/stripe.ts
git commit -m "feat(checkout): Stripe client — MXN Checkout Session (redirect)"
```

---

### Task 4: Cliente PayPal (REST sandbox/live)

Cliente server-only vía REST (sin SDK de servidor). OAuth con client_credentials, crear y capturar orden en USD. Base URL según `PAYPAL_ENV`.

**Files:**
- Create: `lib/checkout/paypal.ts`

**Interfaces:**
- Consumes: `ResolvedCharge` (Task 2); env `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV`.
- Produces:
  - `createPayPalOrder(charge: ResolvedCharge): Promise<{ orderId: string }>`
  - `capturePayPalOrder(orderId: string): Promise<{ status: string }>`

- [ ] **Step 1: Implementar el cliente PayPal**

Create `lib/checkout/paypal.ts`:

```ts
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
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores en `lib/checkout/paypal.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/checkout/paypal.ts
git commit -m "feat(checkout): PayPal REST client — create + capture USD order"
```

---

### Task 5: Ruta de cotización `POST /api/checkout/quote`

Devuelve el `ResolvedCharge` para mostrarlo en la página de checkout (misma fuente que el cobro). Resuelve `fix`/`margin` server-side.

**Files:**
- Create: `app/api/checkout/quote/route.ts`

**Interfaces:**
- Consumes: `resolveCharge`, `CartLine` (Task 2); `getFixRate`, `getUsdMargin` de `@/lib/fx/banxico`; `Locale`.
- Produces: `POST` handler. Body `{ items: CartLine[]; locale: 'es' | 'en' }` → 200 `ResolvedCharge` | 400 `{ error }`.

- [ ] **Step 1: Implementar la ruta**

Create `app/api/checkout/quote/route.ts`:

```ts
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
```

- [ ] **Step 2: Verificar en dev**

Run (con `npm run dev` corriendo, usar un id real del catálogo):

```bash
curl -s -X POST http://localhost:3000/api/checkout/quote \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"id":"<ID_REAL>","kind":"product","qty":1}],"locale":"es"}'
```

Expected: JSON con `{"currency":"MXN","lineItems":[...],"total":...}`.

- [ ] **Step 3: Commit**

```bash
git add app/api/checkout/quote/route.ts
git commit -m "feat(checkout): quote route — server-resolved charge for display"
```

---

### Task 6: Ruta de creación Stripe `POST /api/checkout/stripe`

Re-resuelve el importe server-side y crea la Checkout Session. Solo válida para MXN (ES).

**Files:**
- Create: `app/api/checkout/stripe/route.ts`

**Interfaces:**
- Consumes: `resolveCharge`, `CartLine`; `createStripeSession` (Task 3); `getFixRate`, `getUsdMargin`.
- Produces: `POST` handler. Body `{ items: CartLine[]; locale: 'es' }` → 200 `{ url }` | 400 `{ error }`.

- [ ] **Step 1: Implementar la ruta**

Create `app/api/checkout/stripe/route.ts`:

```ts
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
```

- [ ] **Step 2: Verificar en dev**

Run (con `npm run dev` y un id real):

```bash
curl -s -X POST http://localhost:3000/api/checkout/stripe \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"id":"<ID_REAL>","kind":"product","qty":1}],"locale":"es"}'
```

Expected: `{"url":"https://checkout.stripe.com/c/pay/..."}`.

- [ ] **Step 3: Commit**

```bash
git add app/api/checkout/stripe/route.ts
git commit -m "feat(checkout): Stripe create-session route (MXN, server-resolved)"
```

---

### Task 7: Webhook Stripe `POST /api/webhooks/stripe`

Confirmación server-side del pago (el `success_url` es falsificable). Verifica firma con `STRIPE_WEBHOOK_SECRET` y el cuerpo crudo. Sin DB, acusa recibo y deja el punto de enganche para la fase de órdenes.

**Files:**
- Create: `app/api/webhooks/stripe/route.ts`

**Interfaces:**
- Consumes: `stripe` (reusar cliente de Task 3 — exportar la instancia).
- Produces: `POST` handler → 200 `{ received: true }` | 400 en firma inválida.

- [ ] **Step 1: Exportar la instancia `stripe` desde el cliente**

Modify `lib/checkout/stripe.ts`: cambiar la declaración

```ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')
```

por

```ts
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')
```

- [ ] **Step 2: Implementar el webhook**

Create `app/api/webhooks/stripe/route.ts`:

```ts
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
```

- [ ] **Step 3: Verificar en dev (Stripe CLI)**

Run (requiere Stripe CLI; imprime un `whsec_` que va a `STRIPE_WEBHOOK_SECRET` en `.env.local`, luego reiniciar dev):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
```

Expected: la terminal del webhook muestra `[stripe] checkout.session.completed ...` y responde `200`.

- [ ] **Step 4: Commit**

```bash
git add lib/checkout/stripe.ts app/api/webhooks/stripe/route.ts
git commit -m "feat(checkout): Stripe webhook — signature-verified payment confirmation"
```

---

### Task 8: Rutas PayPal `POST /api/checkout/paypal` y `/capture`

Crear orden (USD, solo EN) y capturar server-side tras la aprobación del cliente. La captura server-side es la confirmación autoritativa de PayPal.

**Files:**
- Create: `app/api/checkout/paypal/route.ts`
- Create: `app/api/checkout/paypal/capture/route.ts`

**Interfaces:**
- Consumes: `resolveCharge`, `CartLine`; `createPayPalOrder`, `capturePayPalOrder` (Task 4); `getFixRate`, `getUsdMargin`.
- Produces:
  - create: `POST` body `{ items, locale }` → 200 `{ orderId }` | 400.
  - capture: `POST` body `{ orderId: string }` → 200 `{ status }` | 400.

- [ ] **Step 1: Implementar la ruta de creación**

Create `app/api/checkout/paypal/route.ts`:

```ts
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
```

- [ ] **Step 2: Implementar la ruta de captura**

Create `app/api/checkout/paypal/capture/route.ts`:

```ts
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
```

- [ ] **Step 3: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores. (El flujo real se prueba end-to-end en la Task 13.)

- [ ] **Step 4: Commit**

```bash
git add app/api/checkout/paypal/route.ts app/api/checkout/paypal/capture/route.ts
git commit -m "feat(checkout): PayPal create + capture routes (USD, server-resolved)"
```

---

### Task 9: Copias i18n del checkout

Agregar textos ES/EN para la página de checkout y el resumen. El tipo `Dictionary` se infiere de `es.json`, así que ambas deben tener las mismas claves.

**Files:**
- Modify: `i18n/dictionaries/es.json`
- Modify: `i18n/dictionaries/en.json`

**Interfaces:**
- Produces: `dict.checkout.{title, summary, payWithCard, payWithPaypal, empty, emptyCta, backToCart, successTitle, successBody, failedTitle, failedBody, currencyNote}`.

- [ ] **Step 1: Agregar la sección `checkout` en `es.json`**

Dentro del objeto raíz de `i18n/dictionaries/es.json` (junto a `"cart"`), agregar:

```json
"checkout": {
  "title": "Finalizar compra",
  "summary": "Resumen del pedido",
  "payWithCard": "Pagar con tarjeta",
  "payWithPaypal": "Pagar con PayPal",
  "empty": "Tu carrito está vacío.",
  "emptyCta": "Ir a la tienda",
  "backToCart": "Volver al carrito",
  "successTitle": "¡Pago confirmado!",
  "successBody": "Gracias por tu compra. Recibirás un correo con los detalles de tu pedido.",
  "failedTitle": "El pago no se completó",
  "failedBody": "No se realizó ningún cargo. Puedes intentarlo de nuevo desde tu carrito.",
  "currencyNote": "Los precios en español se cobran en pesos mexicanos (MXN)."
}
```

- [ ] **Step 2: Agregar la sección `checkout` en `en.json`**

Dentro del objeto raíz de `i18n/dictionaries/en.json`, agregar:

```json
"checkout": {
  "title": "Checkout",
  "summary": "Order summary",
  "payWithCard": "Pay with card",
  "payWithPaypal": "Pay with PayPal",
  "empty": "Your cart is empty.",
  "emptyCta": "Go to shop",
  "backToCart": "Back to cart",
  "successTitle": "Payment confirmed!",
  "successBody": "Thank you for your purchase. You'll receive an email with your order details.",
  "failedTitle": "Payment not completed",
  "failedBody": "No charge was made. You can try again from your cart.",
  "currencyNote": "Prices in English are charged in US dollars (USD)."
}
```

- [ ] **Step 3: Verificar JSON válido y tipos**

Run: `npx tsc --noEmit`
Expected: sin errores (ambos JSON con la misma forma).

- [ ] **Step 4: Commit**

```bash
git add i18n/dictionaries/es.json i18n/dictionaries/en.json
git commit -m "feat(checkout): ES/EN copy for checkout and confirmation"
```

---

### Task 10: Página de checkout `/[locale]/checkout`

Server component que pasa `locale`, `dict` y el `paypalClientId` (publicable) a un client component `CheckoutView`, que lee el carrito, pide la cotización y muestra el botón de pago según el locale.

**Files:**
- Create: `app/[locale]/checkout/page.tsx` (server)
- Create: `components/checkout/CheckoutView.tsx` (client)
- Modify: `package.json` (dependencia `@paypal/react-paypal-js`)

**Interfaces:**
- Consumes: `getDictionary`, `Locale`; `useCart` de `@/lib/cart/store`; `formatMXN`, `formatUSD` de `@/lib/money`; tipos `ResolvedCharge` de `@/lib/checkout/resolveCharge`.
- Produces: ruta `/[locale]/checkout`.

- [ ] **Step 1: Instalar el wrapper de PayPal**

Run: `npm install @paypal/react-paypal-js`
Expected: aparece en `dependencies`.

- [ ] **Step 2: Crear el server component de la página**

Create `app/[locale]/checkout/page.tsx`:

```tsx
import { getDictionary } from '@/i18n/getDictionary'
import type { Locale } from '@/i18n/config'
import { CheckoutView } from '@/components/checkout/CheckoutView'

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
        {dict.checkout.title}
      </h1>
      <CheckoutView
        locale={locale}
        dict={dict}
        paypalClientId={process.env.PAYPAL_CLIENT_ID ?? ''}
      />
    </main>
  )
}
```

- [ ] **Step 3: Crear el client component `CheckoutView`**

Create `components/checkout/CheckoutView.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { useCart } from '@/lib/cart/store'
import { formatMXN, formatUSD } from '@/lib/money'
import { buttonClasses } from '@/components/ui/Button'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/getDictionary'
import type { ResolvedCharge } from '@/lib/checkout/resolveCharge'

type Line = { id: string; kind: 'product' | 'spot'; qty: number }

export function CheckoutView({
  locale,
  dict,
  paypalClientId,
}: {
  locale: Locale
  dict: Dictionary
  paypalClientId: string
}) {
  const router = useRouter()
  const items = useCart((s) => s.items)
  const [mounted, setMounted] = useState(false)
  const [quote, setQuote] = useState<ResolvedCharge | null>(null)
  const [error, setError] = useState<string | null>(null)

  const lines: Line[] = items.map((i) => ({ id: i.id, kind: i.kind, qty: i.qty }))

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted || lines.length === 0) return
    let active = true
    fetch('/api/checkout/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: lines, locale }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return
        if (data.error) setError(data.error)
        else setQuote(data)
      })
      .catch(() => active && setError('quote_failed'))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, locale, JSON.stringify(lines)])

  if (!mounted) {
    return <div className="mt-8 h-40 animate-pulse rounded-2xl bg-panel" aria-hidden />
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center gap-6 rounded-2xl bg-panel px-6 py-16 text-center ring-1 ring-inset ring-white/10">
        <p className="text-lg text-muted">{dict.checkout.empty}</p>
        <Link href={`/${locale}/shop`} className={buttonClasses('gold', 'md')}>
          {dict.checkout.emptyCta}
        </Link>
      </div>
    )
  }

  const fmt = (n: number) =>
    quote?.currency === 'USD' ? formatUSD(n) : formatMXN(n)

  async function payWithStripe() {
    setError(null)
    const res = await fetch('/api/checkout/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: lines, locale }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setError(data.error ?? 'checkout_failed')
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_22rem]">
      <section className="rounded-2xl bg-panel p-6 ring-1 ring-inset ring-white/10">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
          {dict.checkout.summary}
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {(quote?.lineItems ?? []).map((li) => (
            <li key={li.id} className="flex justify-between gap-4 text-sm text-ink">
              <span className="min-w-0 truncate">
                {li.name} × {li.qty}
              </span>
              <span className="tabular-nums">{fmt(li.unitAmount * li.qty)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">{dict.checkout.currencyNote}</p>
      </section>

      <aside className="h-fit rounded-2xl bg-panel p-6 ring-1 ring-inset ring-[color-mix(in_srgb,var(--gold)_16%,transparent)] lg:sticky lg:top-24">
        <p className="font-display text-3xl font-semibold tabular-nums text-ink">
          {quote ? fmt(quote.total) : '—'}
        </p>

        <div className="mt-6">
          {locale === 'es' ? (
            <button
              type="button"
              onClick={payWithStripe}
              className={buttonClasses('gold', 'lg') + ' w-full'}
            >
              {dict.checkout.payWithCard}
            </button>
          ) : (
            <PayPalScriptProvider
              options={{ clientId: paypalClientId, currency: 'USD', intent: 'capture' }}
            >
              <PayPalButtons
                style={{ layout: 'vertical' }}
                createOrder={async () => {
                  const res = await fetch('/api/checkout/paypal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: lines, locale }),
                  })
                  const data = await res.json()
                  if (!data.orderId) throw new Error(data.error ?? 'create_failed')
                  return data.orderId
                }}
                onApprove={async (data) => {
                  await fetch('/api/checkout/paypal/capture', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId: data.orderID }),
                  })
                  router.push(`/${locale}/checkout/success?provider=paypal`)
                }}
              />
            </PayPalScriptProvider>
          )}
        </div>

        {error ? (
          <p className="mt-3 text-center text-xs text-rose-300">{error}</p>
        ) : null}

        <Link
          href={`/${locale}/cart`}
          className="mt-4 block text-center text-sm text-gold underline-offset-4 hover:underline"
        >
          {dict.checkout.backToCart}
        </Link>
      </aside>
    </div>
  )
}
```

- [ ] **Step 4: Verificar que compila y linta**

Run: `npx tsc --noEmit && npm run lint`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json app/[locale]/checkout/page.tsx components/checkout/CheckoutView.tsx
git commit -m "feat(checkout): checkout page with locale-based Stripe/PayPal payment"
```

---

### Task 11: Página de confirmación `/[locale]/checkout/success`

Server component que determina si el pago está confirmado (Stripe: recupera la sesión por id; PayPal: la captura ya ocurrió) y muestra el mensaje. Un pequeño client component limpia el carrito al montar cuando el pago fue exitoso.

**Files:**
- Create: `app/[locale]/checkout/success/page.tsx` (server)
- Create: `components/checkout/ClearCartOnMount.tsx` (client)

**Interfaces:**
- Consumes: `stripe` (Task 3/7); `getDictionary`, `Locale`; `useCart`.
- Produces: ruta `/[locale]/checkout/success`.

- [ ] **Step 1: Crear el client component que limpia el carrito**

Create `components/checkout/ClearCartOnMount.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import { useCart } from '@/lib/cart/store'

export function ClearCartOnMount() {
  const clear = useCart((s) => s.clear)
  useEffect(() => {
    clear()
  }, [clear])
  return null
}
```

- [ ] **Step 2: Crear la página de éxito**

Create `app/[locale]/checkout/success/page.tsx`:

```tsx
import Link from 'next/link'
import { getDictionary } from '@/i18n/getDictionary'
import type { Locale } from '@/i18n/config'
import { stripe } from '@/lib/checkout/stripe'
import { buttonClasses } from '@/components/ui/Button'
import { ClearCartOnMount } from '@/components/checkout/ClearCartOnMount'

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ provider?: string; session_id?: string }>
}) {
  const { locale } = await params
  const { provider, session_id } = await searchParams
  const dict = await getDictionary(locale)

  let paid = false
  if (provider === 'paypal') {
    paid = true // capture already confirmed server-side
  } else if (provider === 'stripe' && session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id)
      paid = session.payment_status === 'paid'
    } catch {
      paid = false
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-20 text-center sm:px-6">
      {paid ? <ClearCartOnMount /> : null}
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
        {paid ? dict.checkout.successTitle : dict.checkout.failedTitle}
      </h1>
      <p className="mt-4 text-muted">
        {paid ? dict.checkout.successBody : dict.checkout.failedBody}
      </p>
      <Link
        href={`/${locale}/shop`}
        className={buttonClasses('gold', 'md') + ' mt-8 inline-flex'}
      >
        {dict.checkout.emptyCta}
      </Link>
    </main>
  )
}
```

- [ ] **Step 3: Verificar que compila y linta**

Run: `npx tsc --noEmit && npm run lint`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add app/[locale]/checkout/success/page.tsx components/checkout/ClearCartOnMount.tsx
git commit -m "feat(checkout): success page with server-side confirmation + cart clear"
```

---

### Task 12: Activar el botón de checkout del carrito

Hoy `CartView.tsx` tiene el botón "Pagar" deshabilitado con `checkoutSoon`. Reemplazar por un enlace a `/[locale]/checkout`.

**Files:**
- Modify: `components/cart/CartView.tsx:72-83`

**Interfaces:**
- Consumes: ruta `/[locale]/checkout` (Task 10). Usa `dict.cart.checkout` (ya existe).

- [ ] **Step 1: Reemplazar el botón deshabilitado por un Link**

En `components/cart/CartView.tsx`, sustituir el bloque del botón deshabilitado y el `checkoutSoon` (líneas ~72-83):

```tsx
        <Button
          variant="gold"
          size="lg"
          disabled
          className="mt-6 w-full"
          aria-disabled
        >
          {dict.cart.checkout}
        </Button>
        <p className="mt-3 text-center text-xs text-muted">
          {dict.cart.checkoutSoon}
        </p>
```

por:

```tsx
        <Link
          href={`/${locale}/checkout`}
          className={cn(buttonClasses('gold', 'lg'), 'mt-6 w-full')}
        >
          {dict.cart.checkout}
        </Link>
```

`Link`, `cn` y `buttonClasses` ya están importados en el archivo.

- [ ] **Step 2: Verificar que compila y linta**

Run: `npx tsc --noEmit && npm run lint`
Expected: sin errores. `Button` puede quedar sin uso; si el linter marca el import de `Button`, quitarlo dejando `buttonClasses`.

- [ ] **Step 3: Commit**

```bash
git add components/cart/CartView.tsx
git commit -m "feat(checkout): enable cart checkout button → /checkout"
```

---

### Task 13: Verificación end-to-end en sandbox + regresión

Probar el flujo completo en sandbox (no rompe lo existente) y verificar la consistencia mostrado-vs-cobrado.

**Files:** ninguno (verificación).

- [ ] **Step 1: Regresión automatizada**

Run: `npm run test && npm run build && npm run lint`
Expected: tests PASS, build OK, lint limpio. (Recordar la nota Windows del README: ruta con `Desktop` en mayúscula.)

- [ ] **Step 2: Configurar el webhook de Stripe para la prueba**

Run:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copiar el `whsec_...` impreso a `STRIPE_WEBHOOK_SECRET` en `.env.local` y reiniciar `npm run dev`.

- [ ] **Step 3: Compra ES (Stripe / MXN)**

Con `npm run dev`: ir a `/es/shop`, agregar un producto al carrito, ir al carrito, clic en "Finalizar compra" → `/es/checkout`. Verificar que el total mostrado está en MXN. Clic en "Pagar con tarjeta" → Stripe Checkout. Pagar con la tarjeta de prueba `4242 4242 4242 4242` (fecha futura, CVC cualquiera). Confirmar redirección a `/es/checkout/success` con "¡Pago confirmado!", que el carrito quedó vacío, y que la terminal del webhook registró `checkout.session.completed`.
Expected: el monto cobrado en Stripe (MXN) == el total mostrado en `/es/checkout`.

- [ ] **Step 4: Compra EN (PayPal / USD)**

Ir a `/en/shop`, agregar un producto, `/en/checkout`. Verificar total en USD. Usar los botones de PayPal con la cuenta **Personal** de sandbox (developer.paypal.com → Sandbox Accounts) para aprobar el pago. Confirmar redirección a `/en/checkout/success` con "Payment confirmed!" y carrito vacío.
Expected: el monto aprobado en PayPal (USD) == el total mostrado en `/en/checkout`.

- [ ] **Step 5: Compra de un spot de Live Break**

En `/es/breaks`, agregar un spot al carrito y completar el checkout ES como en el Step 3.
Expected: el spot se cobra correctamente (mismo flujo que un producto).

- [ ] **Step 6: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "test(checkout): sandbox end-to-end verification notes"
```

---

## Fuera de alcance (documentado, no implementar aquí)

- **Migración de precios a MXN base** (`priceMXN` en `lib/data/`): bloqueada por la lista del cliente; aislada en `resolveCharge` (un solo punto de cambio).
- **OXXO Pay pendiente + registro durable de órdenes**: requieren almacenamiento (p. ej. Vercel/Neon Postgres); siguiente sub-proyecto. El webhook de PayPal dedicado también se difiere aquí — sin almacenamiento no hay estado durable que actualizar, y la captura server-side ya da la confirmación de PayPal.
- **Páginas legales ES/EN (Fase 6)** y **actualización de FAQ (Fase 7)**.
- **Verificación de dominio Apple Pay** con Apple (trámite del cliente; se documenta aparte).
- **Producción/live**: todo se construye y prueba en sandbox primero.
