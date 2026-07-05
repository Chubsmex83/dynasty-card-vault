# Fase 3 — Checkout sandbox end-to-end (diseño)

**Fecha:** 2026-07-03
**Rama:** `feat/payments-phase2-currency`
**Estado:** diseño aprobado, pendiente de plan de implementación

## Objetivo

Desde el carrito existente, un cliente puede **pagar de verdad en modo
sandbox** y ver una confirmación, con el pago validado del lado del servidor.
La versión en español paga en **MXN vía Stripe**; la versión en inglés paga en
**USD vía PayPal**. Al terminar esta rebanada, el flujo completo
carrito → pago → confirmación → webhook funciona en sandbox sin romper nada de
lo que hoy funciona.

Esta es una **rebanada vertical**: junta lo esencial de las Fases 3
(pasarelas), 4 (flujo de checkout) y 5 (seguridad del brief), acotada al camino
feliz para que se pueda probar de punta a punta cuanto antes.

## Contexto del código actual

- **Carrito** (`lib/cart/store.ts`): store Zustand persistido en `localStorage`
  (`dcv-cart`). `CartItem = { id, kind: 'product'|'spot', name, price, qty, meta? }`.
  El `price` guardado es el precio actual (USD) del catálogo.
- **Vista de carrito** (`components/cart/CartView.tsx`): usa `formatPrice`
  (formateador USD antiguo); el botón "Pagar" está **deshabilitado** con el
  texto `checkoutSoon`.
- **Dinero** (`lib/money.ts`): `mxnToUsd`, `formatMXN`, `formatUSD`,
  `formatMoney(mxn, locale, fix, margin)` — listos, aún **no** conectados al
  carrito.
- **Tipo de cambio** (`lib/fx/banxico.ts`): `getFixRate()` server-only, cacheado
  24h, con fallback seguro; `getUsdMargin()` lee `USD_MARGIN` (default 5%).
- **API** `GET /api/fx`: health check del tipo de cambio.
- **Credenciales**: Stripe (test) y PayPal (sandbox) ya en `.env.local`,
  verificadas. `.env*` está gitignored.

## Decisiones de diseño

### 1. Fuente de verdad del precio en el servidor (seguridad)

El carrito vive en el cliente y su `price` es manipulable. **Nunca** se cobra
con base en un importe enviado por el navegador.

El cliente solo envía **IDs + cantidades** (y `locale`). Un módulo de servidor
`resolveCharge(items, locale)` es la **única fuente de verdad** del importe:
busca cada producto/spot en el catálogo (`lib/data/`), calcula el importe
autoritativo y devuelve:

```ts
type ResolvedCharge = {
  currency: 'MXN' | 'USD'
  lineItems: Array<{ id: string; name: string; unitAmount: number; qty: number }>
  total: number
}
```

- `locale === 'es'` → `currency: 'MXN'`, importe = precio base MXN.
- `locale === 'en'` → `currency: 'USD'`, importe =
  `mxnToUsd(base, fix, margin)` usando `getFixRate()` + `getUsdMargin()`.

Esto también garantiza la **consistencia mostrado-vs-cobrado** que exige el
brief (Fase 4.4): el mismo `resolveCharge` alimenta tanto lo que se muestra en
la página de checkout como lo que se manda a la pasarela.

### 2. Aislamiento del bloqueo de la lista de precios MXN

La migración del catálogo a precio base MXN (`priceMXN`) está **bloqueada** por
la lista final de precios del cliente. `resolveCharge` es el **único** punto que
lee el precio base.

Mientras no llegue la lista, `resolveCharge` trata el número base actual del
catálogo **como si fuera el precio base en MXN** (placeholder deliberado): ES lo
usa directo, EN lo convierte con FIX+margen. Cuando llegue la lista, se cambia
**solo** la lectura del precio base (campo `priceMXN` en `lib/data/`) y ninguna
otra parte del checkout se entera. En sandbox el valor exacto es irrelevante; lo
que se prueba es el flujo.

### 3. Sin base de datos en esta rebanada

El proyecto no tiene almacenamiento persistente. El camino feliz de **tarjeta +
PayPal** no lo necesita: la pasarela es la fuente de verdad y la página de
confirmación lee el estado de la sesión/orden **por su ID** directamente de la
pasarela. Los webhooks verifican la firma y confirman el pago server-side, pero
no persisten (en esta rebanada su efecto es de confirmación/monitoreo, no de
registro durable).

**Explícitamente fuera de esta rebanada** (siguiente sub-proyecto, introduce
almacenamiento — p. ej. Vercel/Neon Postgres):

- **OXXO Pay** (pago pendiente que se confirma horas/días después): requiere
  guardar la orden en estado `pending` y actualizarla cuando llegue el webhook.
- **Registro durable de órdenes** (historial, conciliación).

Se documenta como pendiente, no se oculta.

### 4. Pasarela determinada por la moneda de despliegue

Una pasarela por moneda, alineada con lo que ve el cliente:

- ES (muestra MXN) → **Stripe Checkout** en MXN. Stripe México trae en una sola
  integración: tarjetas (Visa/MC/Amex), Apple Pay, Google Pay y Meses Sin
  Intereses (se muestran automáticamente para tarjetas MX elegibles). OXXO
  queda fuera de esta rebanada (ver decisión 3).
- EN (muestra USD) → **PayPal** en USD.

No se ofrece PayPal-en-MXN ni Stripe-en-USD en esta rebanada (YAGNI).

## Componentes

```
lib/checkout/resolveCharge.ts      Fuente de verdad server-side (importe + moneda)
lib/checkout/stripe.ts             Cliente Stripe: crea Checkout Session (MXN)
lib/checkout/paypal.ts             Cliente PayPal: crea y captura Order (USD)
app/api/checkout/stripe/route.ts   POST → crea sesión, devuelve URL de redirect
app/api/checkout/paypal/route.ts   POST → crea orden / captura orden
app/api/webhooks/stripe/route.ts   Verifica firma, procesa checkout.session.completed
app/api/webhooks/paypal/route.ts   Verifica firma, procesa PAYMENT.CAPTURE.COMPLETED
app/[locale]/checkout/page.tsx     Página de checkout (resumen + botón por locale)
app/[locale]/checkout/success/...  Confirmación (lee estado por ID de la pasarela)
components/cart/CartView.tsx        Activar el botón "Pagar" (hoy disabled) → /checkout
```

Cada unidad tiene un propósito único: `resolveCharge` calcula importes; los
clientes de pasarela hablan con Stripe/PayPal; las rutas API orquestan; la UI
muestra y redirige. Los secretos viven solo en el servidor
(`lib/checkout/stripe.ts` y `paypal.ts` son server-only; el publishable key de
Stripe es el único valor público).

## Flujo (camino feliz)

1. Carrito → botón "Pagar" (ya no disabled) → `/[locale]/checkout`.
2. La página de checkout llama a `resolveCharge(items, locale)` en el servidor y
   muestra el resumen con el importe y la moneda correctos.
3. Cliente confirma:
   - **ES**: `POST /api/checkout/stripe` → crea Checkout Session en MXN →
     redirect a Stripe Checkout (tarjetas, wallets, MSI).
   - **EN**: `POST /api/checkout/paypal` → crea Order en USD → flujo PayPal.
4. Cliente paga en sandbox y regresa a `/[locale]/checkout/success?...`.
5. La página de éxito lee el estado por ID de la pasarela y muestra la
   confirmación. El **webhook** confirma el pago server-side (verificación de
   firma). El carrito se limpia al confirmar.

## Manejo de errores

- **Pago fallido / cancelado**: regreso a `/checkout` con mensaje; el carrito se
  conserva.
- **Pasarela caída al crear sesión/orden**: la ruta API responde error; la UI
  muestra un mensaje y no vacía el carrito.
- **Firma de webhook inválida**: se rechaza con 400, sin efectos.
- **Producto inexistente / precio no resoluble en `resolveCharge`**: se aborta el
  checkout con error claro antes de tocar la pasarela.
- **FX no disponible (EN/USD)**: `getFixRate()` ya cae al último valor seguro;
  el checkout nunca queda sin importe.

## Pruebas

- **Unitarias**: `resolveCharge` (moneda por locale, cálculo de importes,
  producto inexistente, spots de breaks, uso correcto de FIX+margen). Firma/parse
  de payloads de webhook con fixtures.
- **End-to-end en sandbox (manual, documentado)**: compra ES con tarjeta de
  prueba de Stripe; compra EN con cuenta sandbox de PayPal; compra de un spot de
  Live Break. Verificar que el importe mostrado == importe cobrado en ambas
  monedas.
- No romper lo existente: `npm run build`, `npm run test`, `npm run lint`
  (desde la ruta con `Desktop` en mayúscula, por la nota de Windows del README).

## Fuera de alcance (esta rebanada)

- Migración del catálogo a precio base MXN (bloqueada; aislada en `resolveCharge`).
- OXXO Pay pendiente + registro durable de órdenes (siguiente sub-proyecto, con DB).
- Páginas legales ES/EN (Fase 6) y actualización de FAQ (Fase 7).
- Verificación de dominio de Apple Pay con Apple (trámite del cliente; se
  documentará aparte).
- Producción/live: todo se construye y prueba en sandbox primero.

## Riesgos / notas

- **Consistencia de moneda**: el mismo `resolveCharge` debe alimentar despliegue
  y cobro; cualquier cálculo de precio duplicado fuera de él es un bug potencial.
- **Redondeo**: `mxnToUsd` redondea a centavos; el importe enviado a la pasarela
  debe ser exactamente el mostrado (misma función, sin recomputar).
- **Idempotencia de webhooks**: sin DB no hay estado que corromper en esta
  rebanada, pero al introducir órdenes habrá que manejar entregas duplicadas.

## Deuda conocida — BLOQUEANTE del sub-proyecto de órdenes/fulfillment

Detectado en la revisión final (2026-07-04). Debe resolverse **antes** de que
exista fulfillment/persistencia de órdenes:

- **Página de éxito de PayPal es falsificable.** `checkout/success` para Stripe
  recupera la sesión por ID server-side (`payment_status === 'paid'`), pero para
  PayPal hace `paid = true` sólo por el query param `provider=paypal`. Hoy el
  impacto es nulo (la captura ya ocurrió server-side antes del redirect, y sólo
  afecta el carrito del propio visitante; no se crea ninguna orden), pero en
  cuanto haya fulfillment esto permitiría marcar una orden como pagada sin
  confirmación. **Arreglo requerido entonces:** pasar el `orderId` de PayPal a la
  página de éxito y reverificar el estado de la captura por ID server-side
  (simetría con Stripe).
