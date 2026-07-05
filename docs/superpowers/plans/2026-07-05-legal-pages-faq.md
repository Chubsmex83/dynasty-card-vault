# Páginas legales (Fase 6) + FAQ (Fase 7) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar 3 páginas legales bilingües (Aviso de Privacidad, Términos y Condiciones, Ventas y No Devoluciones) enlazadas desde el footer, una nota de transparencia PROFECO en el checkout, y un FAQ actualizado con los métodos de pago reales.

**Architecture:** Cada página legal es un server component delgado que arma metadata con `pageMetadata` y renderiza un `LegalLayout` común (título + "última actualización" + estilos de prosa) alrededor de un módulo de contenido TSX por documento e idioma (`content/legal/<doc>.<locale>.tsx`). Los strings de UI y el FAQ viven en los diccionarios i18n; la prosa legal larga vive en los módulos de contenido.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind v4, i18n JSON dictionaries.

## Global Constraints

- **Windows/Next:** correr `next`/`vitest`/`tsc` desde la ruta con `Desktop` en mayúscula (`C:/Users/ADMMIN/Desktop/proyectos/cartas`); casing mezclado duplica React y rompe el build. La build de Vercel (Linux) no se afecta.
- **Plantillas, no texto final:** cada archivo en `content/legal/` empieza con un comentario JSDoc prominente que declara que el texto es una PLANTILLA que DEBE revisar un abogado antes de publicar, con énfasis en No Devoluciones y en la sección de Live Breaks. NO hay banner visible para el usuario final.
- **Nunca inventar datos:** razón social, RFC, domicilio fiscal, correo, teléfono, costos de envío y tiempos de entrega van como placeholders visibles `[TODO: ...]` en el texto renderizado. No inventarlos.
- **Paridad de claves i18n:** el tipo `Dictionary` se infiere de `es.json`; toda clave nueva se agrega a `es.json` **y** `en.json` con la misma forma o `tsc` falla.
- **Slugs en inglés:** rutas `/[locale]/legal/{privacy,terms,sales}` (consistente con `shop`/`breaks`/`cart`/`checkout`).
- **Patrón de página existente** (de `app/[locale]/cart/page.tsx`): `generateMetadata` usa `isLocale` + `getDictionary` + `pageMetadata({ title, description, path, locale })` de `@/lib/seo`; el componente por defecto hace `notFound()` si `!isLocale(locale)`.
- Estas son páginas de prosa: no llevan pruebas unitarias (YAGNI); se verifican con `npm run build` + revisión visual. La única verificación automática relevante es `npx tsc --noEmit` y `npm run test` (paridad i18n).

---

### Task 1: Strings i18n de UI (footer, legal, checkout PROFECO)

Agrega las claves de UI que consumen el footer, las páginas legales y la nota PROFECO. (El FAQ se actualiza en la Task 9.)

**Files:**
- Modify: `i18n/dictionaries/es.json`
- Modify: `i18n/dictionaries/en.json`

**Interfaces:**
- Produces (nuevas claves, misma forma en ambos dicts):
  - `footer.legal: string`
  - `legal: { lastUpdated: string; privacyTitle: string; termsTitle: string; salesTitle: string }`
  - `checkout.transparencyTitle: string`, `checkout.transparencyPayments: string`, `checkout.transparencyShipping: string`, `checkout.transparencyDelivery: string`, `checkout.transparencyPolicies: string`, `checkout.termsLink: string`, `checkout.salesLink: string`

- [ ] **Step 1: Agregar claves en `es.json`**

En `i18n/dictionaries/es.json`, dentro del objeto `"footer"` agrega la clave `"legal"` (junto a `"explore"`/`"categories"`):

```json
    "legal": "Legal"
```

Agrega en la raíz del objeto (junto a `"footer"`) una nueva sección `"legal"`:

```json
  "legal": {
    "lastUpdated": "Última actualización",
    "privacyTitle": "Aviso de Privacidad",
    "termsTitle": "Términos y Condiciones",
    "salesTitle": "Política de Ventas y No Devoluciones"
  },
```

Dentro del objeto `"checkout"` existente, agrega:

```json
    "transparencyTitle": "Información de compra",
    "transparencyPayments": "Aceptamos tarjetas (Visa, Mastercard, American Express), Apple Pay y Google Pay, y PayPal para pagos internacionales.",
    "transparencyShipping": "Envío con seguro incluido. Costo de envío: [TODO: costo de envío].",
    "transparencyDelivery": "Tiempo estimado de entrega: [TODO: tiempos de entrega].",
    "transparencyPolicies": "Al completar tu compra aceptas nuestros",
    "termsLink": "Términos y Condiciones",
    "salesLink": "Política de Ventas y No Devoluciones"
```

- [ ] **Step 2: Agregar las mismas claves en `en.json`**

En `i18n/dictionaries/en.json`, dentro de `"footer"`:

```json
    "legal": "Legal"
```

Sección `"legal"` en la raíz:

```json
  "legal": {
    "lastUpdated": "Last updated",
    "privacyTitle": "Privacy Notice",
    "termsTitle": "Terms and Conditions",
    "salesTitle": "Sales and No-Returns Policy"
  },
```

Dentro de `"checkout"`:

```json
    "transparencyTitle": "Purchase information",
    "transparencyPayments": "We accept cards (Visa, Mastercard, American Express), Apple Pay and Google Pay, and PayPal for international payments.",
    "transparencyShipping": "Shipping includes insurance. Shipping cost: [TODO: shipping cost].",
    "transparencyDelivery": "Estimated delivery time: [TODO: delivery times].",
    "transparencyPolicies": "By completing your purchase you accept our",
    "termsLink": "Terms and Conditions",
    "salesLink": "Sales and No-Returns Policy"
```

- [ ] **Step 3: Verificar JSON válido, tipos y paridad**

Run: `node -e "require('./i18n/dictionaries/es.json'); require('./i18n/dictionaries/en.json'); console.log('ok')"`
Expected: `ok`.
Run: `npx tsc --noEmit && npm run test`
Expected: sin errores de tipo; 33/33 tests siguen pasando.

- [ ] **Step 4: Commit**

```bash
git add i18n/dictionaries/es.json i18n/dictionaries/en.json
git commit -m "feat(legal): i18n strings for footer, legal pages and checkout transparency"
```

---

### Task 2: `LegalLayout` — marco común

Componente que da el título, la línea "última actualización" y los estilos de prosa alrededor del contenido legal.

**Files:**
- Create: `components/legal/LegalLayout.tsx`

**Interfaces:**
- Produces: `LegalLayout(props: { title: string; lastUpdatedLabel: string; children: React.ReactNode }): JSX.Element`
- Consumes: nada de tareas previas.

- [ ] **Step 1: Crear el componente**

Create `components/legal/LegalLayout.tsx`:

```tsx
import type { ReactNode } from 'react'

/**
 * Shared frame for legal pages: title, "last updated" line, reading width and
 * prose styling. The prose styling targets the child content module's raw
 * <h2>/<p>/<ul> elements (no typography plugin in this project).
 */
export function LegalLayout({
  title,
  lastUpdatedLabel,
  children,
}: {
  title: string
  lastUpdatedLabel: string
  children: ReactNode
}) {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-14 sm:py-20">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-muted">
        {lastUpdatedLabel}: [TODO: fecha de publicación]
      </p>
      <div
        className="mt-10 text-sm leading-relaxed text-muted [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:font-medium [&_h3]:text-ink [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_a]:text-gold [&_a]:underline-offset-4 hover:[&_a]:underline"
      >
        {children}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add components/legal/LegalLayout.tsx
git commit -m "feat(legal): shared LegalLayout frame"
```

---

### Task 3: Aviso de Privacidad — contenido (ES/EN) + página

**Files:**
- Create: `content/legal/privacy.es.tsx`
- Create: `content/legal/privacy.en.tsx`
- Create: `app/[locale]/legal/privacy/page.tsx`

**Interfaces:**
- Consumes: `LegalLayout` (Task 2); `dict.legal.privacyTitle`, `dict.legal.lastUpdated` (Task 1); `pageMetadata`, `isLocale`, `getDictionary`.
- Produces: ruta `/[locale]/legal/privacy`; módulos `PrivacyEs`/`PrivacyEn` (default exports).

- [ ] **Step 1: Crear el contenido en español**

Create `content/legal/privacy.es.tsx`:

```tsx
/**
 * PLANTILLA — NO PUBLICAR SIN REVISIÓN LEGAL.
 * Este texto es una plantilla base y DEBE ser revisado por un abogado antes de
 * publicarse. Los datos entre [TODO: ...] son reales del negocio y los completa
 * el cliente; no inventar.
 */
export default function PrivacyEs() {
  return (
    <>
      <p>
        El presente Aviso de Privacidad se emite en cumplimiento de la Ley Federal
        de Protección de Datos Personales en Posesión de los Particulares. El
        responsable del tratamiento de sus datos personales es [TODO: razón social],
        con RFC [TODO: RFC] y domicilio en [TODO: domicilio fiscal].
      </p>

      <h2>Datos personales que recabamos</h2>
      <p>
        Podemos recabar nombre, domicilio de envío, correo electrónico, teléfono y
        datos de facturación. Los datos de pago se procesan directamente por
        nuestras pasarelas de pago (Stripe y PayPal) y no son almacenados por
        nosotros.
      </p>

      <h2>Finalidades del tratamiento</h2>
      <p>
        Utilizamos sus datos para procesar y enviar sus pedidos, emitir
        comprobantes, brindar atención al cliente y, cuando usted lo autorice,
        enviarle comunicaciones promocionales.
      </p>

      <h2>Transferencias</h2>
      <p>
        No transferimos sus datos a terceros salvo los proveedores necesarios para
        cumplir con su pedido (pasarelas de pago y servicios de paquetería) o
        cuando lo exija la ley.
      </p>

      <h2>Derechos ARCO</h2>
      <p>
        Usted tiene derecho a Acceder, Rectificar y Cancelar sus datos personales,
        así como a Oponerse a su tratamiento (derechos ARCO). Para ejercerlos,
        envíe su solicitud al correo [TODO: correo de contacto].
      </p>

      <h2>Uso de cookies</h2>
      <p>
        El sitio utiliza cookies y tecnologías similares para recordar su carrito y
        mejorar su experiencia. Puede deshabilitarlas desde la configuración de su
        navegador.
      </p>

      <h2>Contacto</h2>
      <p>
        Para cualquier duda sobre este Aviso de Privacidad, contáctenos en
        [TODO: correo de contacto] o al [TODO: teléfono].
      </p>
    </>
  )
}
```

- [ ] **Step 2: Crear el contenido en inglés**

Create `content/legal/privacy.en.tsx` — traducción fiel del archivo `.es.tsx`, conservando la misma estructura de secciones, los marcadores `[TODO: ...]` idénticos y el mismo comentario de cabecera (traducido):

```tsx
/**
 * TEMPLATE — DO NOT PUBLISH WITHOUT LEGAL REVIEW.
 * This text is a base template and MUST be reviewed by a lawyer before
 * publishing. The [TODO: ...] values are the business's real data, filled in by
 * the client; do not invent them.
 */
export default function PrivacyEn() {
  return (
    <>
      <p>
        This Privacy Notice is issued in compliance with Mexico's Federal Law on
        the Protection of Personal Data Held by Private Parties. The party
        responsible for processing your personal data is [TODO: legal name], with
        Tax ID [TODO: RFC] and address at [TODO: registered address].
      </p>

      <h2>Personal data we collect</h2>
      <p>
        We may collect your name, shipping address, email, phone number and billing
        details. Payment data is processed directly by our payment gateways (Stripe
        and PayPal) and is not stored by us.
      </p>

      <h2>Purposes of processing</h2>
      <p>
        We use your data to process and ship your orders, issue receipts, provide
        customer service and, when you authorize it, send you promotional
        communications.
      </p>

      <h2>Transfers</h2>
      <p>
        We do not transfer your data to third parties except the providers needed
        to fulfill your order (payment gateways and shipping carriers) or when
        required by law.
      </p>

      <h2>ARCO rights</h2>
      <p>
        You have the right to Access, Rectify and Cancel your personal data, and to
        Oppose its processing (ARCO rights). To exercise them, send your request to
        [TODO: contact email].
      </p>

      <h2>Use of cookies</h2>
      <p>
        The site uses cookies and similar technologies to remember your cart and
        improve your experience. You can disable them from your browser settings.
      </p>

      <h2>Contact</h2>
      <p>
        For any questions about this Privacy Notice, contact us at
        [TODO: contact email] or at [TODO: phone].
      </p>
    </>
  )
}
```

- [ ] **Step 3: Crear la página**

Create `app/[locale]/legal/privacy/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/getDictionary'
import { pageMetadata } from '@/lib/seo'
import { LegalLayout } from '@/components/legal/LegalLayout'
import PrivacyEs from '@/content/legal/privacy.es'
import PrivacyEn from '@/content/legal/privacy.en'

const DESCRIPTION: Record<Locale, string> = {
  es: 'Aviso de Privacidad de Dynasty Card Vault: cómo recabamos, usamos y protegemos tus datos personales.',
  en: 'Dynasty Card Vault Privacy Notice: how we collect, use and protect your personal data.',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = await getDictionary(locale)
  return pageMetadata({
    title: dict.legal.privacyTitle,
    description: DESCRIPTION[locale],
    path: '/legal/privacy',
    locale,
  })
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = await getDictionary(locale)
  return (
    <LegalLayout title={dict.legal.privacyTitle} lastUpdatedLabel={dict.legal.lastUpdated}>
      {locale === 'en' ? <PrivacyEn /> : <PrivacyEs />}
    </LegalLayout>
  )
}
```

- [ ] **Step 4: Verificar build de la ruta**

Run: `npx tsc --noEmit`
Expected: sin errores.
Run: `npm run build`
Expected: build OK; en la lista de rutas aparece `/[locale]/legal/privacy` con `/es/legal/privacy` y `/en/legal/privacy`.

- [ ] **Step 5: Commit**

```bash
git add content/legal/privacy.es.tsx content/legal/privacy.en.tsx app/[locale]/legal/privacy/page.tsx
git commit -m "feat(legal): privacy notice page (ES/EN template)"
```

---

### Task 4: Términos y Condiciones — contenido (ES/EN) + página

Incluye una sección separada y claramente titulada de **Live Breaks**.

**Files:**
- Create: `content/legal/terms.es.tsx`
- Create: `content/legal/terms.en.tsx`
- Create: `app/[locale]/legal/terms/page.tsx`

**Interfaces:**
- Consumes: `LegalLayout`; `dict.legal.termsTitle`, `dict.legal.lastUpdated`; `pageMetadata`, `isLocale`, `getDictionary`.
- Produces: ruta `/[locale]/legal/terms`; `TermsEs`/`TermsEn` (default exports).

- [ ] **Step 1: Crear el contenido en español**

Create `content/legal/terms.es.tsx`:

```tsx
/**
 * PLANTILLA — NO PUBLICAR SIN REVISIÓN LEGAL.
 * Este texto es una plantilla base y DEBE ser revisado por un abogado antes de
 * publicarse. Presta especial atención a la sección de Live Breaks. Los datos
 * entre [TODO: ...] los completa el cliente; no inventar.
 */
export default function TermsEs() {
  return (
    <>
      <p>
        Estos Términos y Condiciones regulan el uso del sitio y la compra de
        productos ofrecidos por [TODO: razón social] ("Dynasty Card Vault"). Al
        usar el sitio o realizar una compra, usted acepta estos términos.
      </p>

      <h2>Proceso de compra y pago</h2>
      <p>
        Los precios se muestran en pesos mexicanos (MXN) en la versión en español y
        en dólares estadounidenses (USD) en la versión en inglés. El pago se
        procesa mediante Stripe (tarjetas y wallets, en MXN) o PayPal (pagos
        internacionales, en USD). El precio mostrado al confirmar es el precio que
        se cobra.
      </p>

      <h2>Envíos</h2>
      <p>
        Los pedidos se envían con seguro incluido. Los costos y tiempos de entrega
        se indican en el checkout: costo de envío [TODO: costo de envío], tiempo
        estimado [TODO: tiempos de entrega].
      </p>

      <h2>Propiedad intelectual</h2>
      <p>
        Todo el contenido del sitio (marcas, logotipos, textos e imágenes) es
        propiedad de [TODO: razón social] o de sus respectivos titulares y no puede
        usarse sin autorización.
      </p>

      <h2>Live Breaks</h2>
      <p>
        Un "live break" es una transmisión en vivo en la que se abren cajas selladas
        y cada participante recibe las cartas correspondientes al spot o equipo que
        haya adquirido.
      </p>
      <ul>
        <li>
          Al comprar un spot, usted adquiere el derecho a recibir las cartas que
          correspondan a ese spot según el resultado de la apertura.
        </li>
        <li>
          Los resultados dependen del contenido aleatorio de las cajas; no
          garantizamos cartas, jugadores ni valores específicos.
        </li>
        <li>
          Una vez iniciado el break, la compra del spot es final conforme a la
          Política de Ventas y No Devoluciones.
        </li>
        <li>
          [TODO: revisión legal] La mecánica de los breaks puede estar sujeta a
          regulación aplicable; esta sección debe ser revisada por un abogado.
        </li>
      </ul>

      <h2>Limitación de responsabilidad</h2>
      <p>
        En la medida permitida por la ley, nuestra responsabilidad se limita al
        valor del producto adquirido. Nada en estos términos limita los derechos
        que la ley otorgue al consumidor.
      </p>

      <h2>Ley aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de los Estados Unidos Mexicanos.
      </p>
    </>
  )
}
```

- [ ] **Step 2: Crear el contenido en inglés**

Create `content/legal/terms.en.tsx` — traducción fiel del `.es.tsx` con la misma estructura (incluida la sección **Live Breaks** con sus 4 viñetas y el `[TODO: revisión legal]` → `[TODO: legal review]`), los marcadores `[TODO: ...]` y el comentario de cabecera traducido (`TEMPLATE — DO NOT PUBLISH WITHOUT LEGAL REVIEW. ... Pay special attention to the Live Breaks section. ...`):

```tsx
/**
 * TEMPLATE — DO NOT PUBLISH WITHOUT LEGAL REVIEW.
 * This text is a base template and MUST be reviewed by a lawyer before
 * publishing. Pay special attention to the Live Breaks section. The [TODO: ...]
 * values are filled in by the client; do not invent them.
 */
export default function TermsEn() {
  return (
    <>
      <p>
        These Terms and Conditions govern the use of the site and the purchase of
        products offered by [TODO: legal name] ("Dynasty Card Vault"). By using the
        site or making a purchase, you accept these terms.
      </p>

      <h2>Purchase and payment</h2>
      <p>
        Prices are shown in Mexican pesos (MXN) on the Spanish version and in US
        dollars (USD) on the English version. Payment is processed through Stripe
        (cards and wallets, in MXN) or PayPal (international payments, in USD). The
        price shown at confirmation is the price charged.
      </p>

      <h2>Shipping</h2>
      <p>
        Orders ship with insurance included. Shipping costs and delivery times are
        shown at checkout: shipping cost [TODO: shipping cost], estimated time
        [TODO: delivery times].
      </p>

      <h2>Intellectual property</h2>
      <p>
        All site content (trademarks, logos, text and images) belongs to
        [TODO: legal name] or its respective owners and may not be used without
        authorization.
      </p>

      <h2>Live Breaks</h2>
      <p>
        A "live break" is a live stream in which sealed boxes are opened and each
        participant receives the cards corresponding to the spot or team they
        purchased.
      </p>
      <ul>
        <li>
          By purchasing a spot, you acquire the right to receive the cards
          corresponding to that spot according to the result of the opening.
        </li>
        <li>
          Results depend on the random contents of the boxes; we do not guarantee
          specific cards, players or values.
        </li>
        <li>
          Once the break has started, the spot purchase is final under the Sales
          and No-Returns Policy.
        </li>
        <li>
          [TODO: legal review] The mechanics of breaks may be subject to applicable
          regulation; this section must be reviewed by a lawyer.
        </li>
      </ul>

      <h2>Limitation of liability</h2>
      <p>
        To the extent permitted by law, our liability is limited to the value of
        the product purchased. Nothing in these terms limits the rights granted to
        the consumer by law.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of the United Mexican States.</p>
    </>
  )
}
```

- [ ] **Step 3: Crear la página**

Create `app/[locale]/legal/terms/page.tsx` (idéntico a `privacy/page.tsx` pero con Terms):

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/getDictionary'
import { pageMetadata } from '@/lib/seo'
import { LegalLayout } from '@/components/legal/LegalLayout'
import TermsEs from '@/content/legal/terms.es'
import TermsEn from '@/content/legal/terms.en'

const DESCRIPTION: Record<Locale, string> = {
  es: 'Términos y Condiciones de Dynasty Card Vault, incluyendo el funcionamiento de los Live Breaks.',
  en: 'Dynasty Card Vault Terms and Conditions, including how Live Breaks work.',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = await getDictionary(locale)
  return pageMetadata({
    title: dict.legal.termsTitle,
    description: DESCRIPTION[locale],
    path: '/legal/terms',
    locale,
  })
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = await getDictionary(locale)
  return (
    <LegalLayout title={dict.legal.termsTitle} lastUpdatedLabel={dict.legal.lastUpdated}>
      {locale === 'en' ? <TermsEn /> : <TermsEs />}
    </LegalLayout>
  )
}
```

- [ ] **Step 4: Verificar build de la ruta**

Run: `npx tsc --noEmit && npm run build`
Expected: build OK; aparece `/[locale]/legal/terms` (`/es/...` y `/en/...`).

- [ ] **Step 5: Commit**

```bash
git add content/legal/terms.es.tsx content/legal/terms.en.tsx app/[locale]/legal/terms/page.tsx
git commit -m "feat(legal): terms and conditions page with Live Breaks section (ES/EN)"
```

---

### Task 5: Política de Ventas y No Devoluciones — contenido (ES/EN) + página

Incluye la sección aparte marcada `[TODO: revisión legal]` sobre producto dañado/defectuoso/distinto a lo anunciado, sin negar derechos estatutarios.

**Files:**
- Create: `content/legal/sales.es.tsx`
- Create: `content/legal/sales.en.tsx`
- Create: `app/[locale]/legal/sales/page.tsx`

**Interfaces:**
- Consumes: `LegalLayout`; `dict.legal.salesTitle`, `dict.legal.lastUpdated`; `pageMetadata`, `isLocale`, `getDictionary`.
- Produces: ruta `/[locale]/legal/sales`; `SalesEs`/`SalesEn` (default exports).

- [ ] **Step 1: Crear el contenido en español**

Create `content/legal/sales.es.tsx`:

```tsx
/**
 * PLANTILLA — NO PUBLICAR SIN REVISIÓN LEGAL.
 * Este texto es una plantilla base y DEBE ser revisado por un abogado antes de
 * publicarse. IMPORTANTE: la sección sobre producto dañado/defectuoso NO debe
 * negar derechos que la ley mexicana conserve al consumidor. Los datos entre
 * [TODO: ...] los completa el cliente; no inventar.
 */
export default function SalesEs() {
  return (
    <>
      <p>
        En Dynasty Card Vault todas las ventas son finales. Debido a la naturaleza
        coleccionable de nuestros productos, no aceptamos devoluciones ni
        reembolsos por arrepentimiento o cambio de opinión en ningún producto,
        incluyendo cartas individuales, cajas selladas, memorabilia y spots de Live
        Breaks.
      </p>

      <h2>Confirmación de compra</h2>
      <p>
        Antes de pagar, usted revisa el resumen de su pedido con el precio y la
        moneda aplicables. Al completar el pago, confirma que acepta esta política.
      </p>

      <h2>Producto dañado, defectuoso o distinto a lo anunciado</h2>
      <p>
        [TODO: revisión legal] Esta sección debe ser revisada por un abogado. Bajo
        la ley mexicana, el consumidor puede conservar ciertos derechos cuando un
        producto llega dañado, defectuoso o es distinto a lo anunciado, aun cuando
        la venta sea final. Si su pedido presenta alguno de estos casos,
        contáctenos en [TODO: correo de contacto] dentro de [TODO: plazo] con su
        número de pedido y evidencia fotográfica para evaluar su situación.
      </p>

      <h2>Contacto</h2>
      <p>
        Para cualquier duda sobre esta política, escríbanos a
        [TODO: correo de contacto].
      </p>
    </>
  )
}
```

- [ ] **Step 2: Crear el contenido en inglés**

Create `content/legal/sales.en.tsx` — traducción fiel con la misma estructura, la sección `[TODO: legal review]` sobre producto dañado/defectuoso, los marcadores `[TODO: ...]` y el comentario de cabecera traducido (incluida la advertencia de que NO se nieguen derechos estatutarios):

```tsx
/**
 * TEMPLATE — DO NOT PUBLISH WITHOUT LEGAL REVIEW.
 * This text is a base template and MUST be reviewed by a lawyer before
 * publishing. IMPORTANT: the section on damaged/defective products must NOT deny
 * rights that Mexican law may retain for the consumer. The [TODO: ...] values are
 * filled in by the client; do not invent them.
 */
export default function SalesEn() {
  return (
    <>
      <p>
        At Dynasty Card Vault all sales are final. Due to the collectible nature of
        our products, we do not accept returns or refunds for buyer's remorse or a
        change of mind on any product, including single cards, sealed boxes,
        memorabilia and Live Break spots.
      </p>

      <h2>Purchase confirmation</h2>
      <p>
        Before paying, you review your order summary with the applicable price and
        currency. By completing payment, you confirm that you accept this policy.
      </p>

      <h2>Damaged, defective or not-as-described products</h2>
      <p>
        [TODO: legal review] This section must be reviewed by a lawyer. Under
        Mexican law, the consumer may retain certain rights when a product arrives
        damaged, defective or is not as described, even when the sale is final. If
        your order has any of these issues, contact us at [TODO: contact email]
        within [TODO: timeframe] with your order number and photo evidence so we
        can review your situation.
      </p>

      <h2>Contact</h2>
      <p>For any questions about this policy, email us at [TODO: contact email].</p>
    </>
  )
}
```

- [ ] **Step 3: Crear la página**

Create `app/[locale]/legal/sales/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/getDictionary'
import { pageMetadata } from '@/lib/seo'
import { LegalLayout } from '@/components/legal/LegalLayout'
import SalesEs from '@/content/legal/sales.es'
import SalesEn from '@/content/legal/sales.en'

const DESCRIPTION: Record<Locale, string> = {
  es: 'Política de Ventas y No Devoluciones de Dynasty Card Vault: todas las ventas son finales.',
  en: 'Dynasty Card Vault Sales and No-Returns Policy: all sales are final.',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = await getDictionary(locale)
  return pageMetadata({
    title: dict.legal.salesTitle,
    description: DESCRIPTION[locale],
    path: '/legal/sales',
    locale,
  })
}

export default async function SalesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = await getDictionary(locale)
  return (
    <LegalLayout title={dict.legal.salesTitle} lastUpdatedLabel={dict.legal.lastUpdated}>
      {locale === 'en' ? <SalesEn /> : <SalesEs />}
    </LegalLayout>
  )
}
```

- [ ] **Step 4: Verificar build de la ruta**

Run: `npx tsc --noEmit && npm run build`
Expected: build OK; aparece `/[locale]/legal/sales` (`/es/...` y `/en/...`).

- [ ] **Step 5: Commit**

```bash
git add content/legal/sales.es.tsx content/legal/sales.en.tsx app/[locale]/legal/sales/page.tsx
git commit -m "feat(legal): sales and no-returns policy page (ES/EN)"
```

---

### Task 6: Columna "Legal" en el footer

**Files:**
- Modify: `components/layout/Footer.tsx`

**Interfaces:**
- Consumes: `dict.footer.legal`, `dict.legal.{privacyTitle,termsTitle,salesTitle}` (Task 1); rutas legales (Tasks 3–5).

- [ ] **Step 1: Agregar el arreglo de enlaces legales**

En `components/layout/Footer.tsx`, después del arreglo `categories` (~línea 24), agrega:

```tsx
  const legal = [
    { href: `/${locale}/legal/privacy`, label: dict.legal.privacyTitle },
    { href: `/${locale}/legal/terms`, label: dict.legal.termsTitle },
    { href: `/${locale}/legal/sales`, label: dict.legal.salesTitle },
  ]
```

- [ ] **Step 2: Ampliar el grid y agregar la columna**

Cambia el contenedor del grid de columnas de `lg:grid-cols-4` a `lg:grid-cols-5`:

```tsx
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
```

Después del bloque `{/* Categories */}` (antes del cierre `</div>` del grid, ~línea 88), agrega la columna Legal:

```tsx
          {/* Legal */}
          <div>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
              {dict.footer.legal}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
```

- [ ] **Step 3: Verificar que compila y linta**

Run: `npx tsc --noEmit && npm run lint`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add components/layout/Footer.tsx
git commit -m "feat(legal): footer Legal column linking the three policy pages"
```

---

### Task 7: Nota de transparencia PROFECO en el checkout

**Files:**
- Modify: `components/checkout/CheckoutView.tsx`

**Interfaces:**
- Consumes: `dict.checkout.{transparencyTitle,transparencyPayments,transparencyShipping,transparencyDelivery,transparencyPolicies,termsLink,salesLink}` (Task 1); rutas legales (Tasks 4–5). `Link` de `next/link` (ya importado en el archivo).

- [ ] **Step 1: Agregar el bloque de transparencia bajo el resumen**

En `components/checkout/CheckoutView.tsx`, dentro de la `<section>` del resumen (la que contiene `dict.checkout.summary` y la lista de line items), justo después del `<p>` que muestra `dict.checkout.currencyNote`, agrega:

```tsx
        <div className="mt-6 border-t border-white/10 pt-4 text-xs text-muted">
          <h3 className="font-medium text-ink">{dict.checkout.transparencyTitle}</h3>
          <p className="mt-2">{dict.checkout.transparencyPayments}</p>
          <p className="mt-1">{dict.checkout.transparencyShipping}</p>
          <p className="mt-1">{dict.checkout.transparencyDelivery}</p>
          <p className="mt-2">
            {dict.checkout.transparencyPolicies}{' '}
            <Link href={`/${locale}/legal/terms`} className="text-gold underline-offset-4 hover:underline">
              {dict.checkout.termsLink}
            </Link>
            {' · '}
            <Link href={`/${locale}/legal/sales`} className="text-gold underline-offset-4 hover:underline">
              {dict.checkout.salesLink}
            </Link>
            .
          </p>
        </div>
```

- [ ] **Step 2: Verificar que compila, linta y no rompe tests**

Run: `npx tsc --noEmit && npm run lint && npm run test`
Expected: sin errores; 33/33 tests pasan.

- [ ] **Step 3: Commit**

```bash
git add components/checkout/CheckoutView.tsx
git commit -m "feat(legal): PROFECO purchase-transparency note on checkout"
```

---

### Task 8: Actualizar el FAQ (Fase 7)

Reemplaza la respuesta de "métodos de pago" por la real y agrega una pregunta de devoluciones que enlaza a la política.

**Files:**
- Modify: `i18n/dictionaries/es.json`
- Modify: `i18n/dictionaries/en.json`

**Interfaces:**
- Consumes: nada nuevo. El FAQ se renderiza desde el array `faq` (ya existente).

- [ ] **Step 1: Reemplazar la respuesta de métodos de pago en `es.json`**

En `i18n/dictionaries/es.json`, en el array `"faq"`, reemplaza el objeto cuya `"q"` es `"¿Qué métodos de pago aceptan?"` por:

```json
    {
      "q": "¿Qué métodos de pago aceptan?",
      "a": "Aceptamos tarjetas Visa, Mastercard y American Express, además de Apple Pay y Google Pay, mediante Stripe; y PayPal para pagos internacionales. Meses sin intereses y OXXO estarán disponibles según disponibilidad [TODO: confirmar]."
    },
    {
      "q": "¿Puedo devolver un producto?",
      "a": "Todas las ventas son finales: no aceptamos devoluciones ni reembolsos por cambio de opinión. Si tu pedido llega dañado, defectuoso o distinto a lo anunciado, revisa nuestra Política de Ventas y No Devoluciones y contáctanos."
    }
```

(Es decir: se conserva la pregunta de métodos de pago con la nueva respuesta y se agrega inmediatamente después la pregunta de devoluciones. Cuida las comas del array JSON.)

- [ ] **Step 2: Aplicar el mismo cambio en `en.json`**

En `i18n/dictionaries/en.json`, reemplaza el objeto cuya `"q"` es la de métodos de pago (`"What payment methods do you accept?"` o equivalente existente) por:

```json
    {
      "q": "What payment methods do you accept?",
      "a": "We accept Visa, Mastercard and American Express cards, plus Apple Pay and Google Pay, through Stripe; and PayPal for international payments. Interest-free months and OXXO will be available subject to availability [TODO: confirm]."
    },
    {
      "q": "Can I return a product?",
      "a": "All sales are final: we do not accept returns or refunds for a change of mind. If your order arrives damaged, defective or not as described, review our Sales and No-Returns Policy and contact us."
    }
```

- [ ] **Step 3: Verificar JSON, tipos y tests**

Run: `node -e "require('./i18n/dictionaries/es.json'); require('./i18n/dictionaries/en.json'); console.log('ok')"`
Expected: `ok`.
Run: `npx tsc --noEmit && npm run test`
Expected: sin errores; 33/33 tests pasan.

- [ ] **Step 4: Commit**

```bash
git add i18n/dictionaries/es.json i18n/dictionaries/en.json
git commit -m "feat(faq): real payment methods + returns question (Phase 7)"
```

---

### Task 9: Verificación final — build + revisión visual

**Files:** ninguno (verificación).

- [ ] **Step 1: Regresión completa**

Run: `npm run test && npm run build && npm run lint`
Expected: 33/33 tests; build OK con las 3 rutas legales (`/es|/en` × `legal/{privacy,terms,sales}`) prerenderizadas; lint limpio. (Correr desde la ruta con `Desktop` en mayúscula.)

- [ ] **Step 2: Revisión visual (servidor de producción estable)**

Nota Windows: `next dev` puede corromperse ("Jest worker...") si se mata a medias; usar `npm run start` sobre el build recién hecho.

Run: `npm run start` (en background) y luego, con el server arriba, capturar/abrir:
- `http://localhost:3000/es/legal/privacy` y `/en/legal/privacy`
- `http://localhost:3000/es/legal/terms` y `/en/legal/terms`
- `http://localhost:3000/es/legal/sales` y `/en/legal/sales`
- `http://localhost:3000/es/checkout` (con un artículo en el carrito) para ver la nota PROFECO
- `http://localhost:3000/es` (footer con la columna Legal y sus 3 enlaces)

Expected: cada página legal muestra su título, la línea "Última actualización: [TODO: fecha de publicación]", su contenido con los `[TODO: ...]` visibles, y (Términos) la sección Live Breaks / (Ventas) la sección de producto dañado. El footer muestra la columna "Legal" con los 3 enlaces que navegan correctamente. La nota PROFECO aparece en el checkout con enlaces a Términos y Ventas.

- [ ] **Step 3: Apagar el server**

Run: `taskkill //F //IM node.exe //T` (o el equivalente para detener el server de background).

---

## Fuera de alcance (no implementar aquí)

- Revisión legal real de los textos (la hace un abogado) y llenado de los `[TODO]` con datos reales del cliente.
- `sitemap.xml` / `robots.txt` (no se tocan en esta rebanada).
- Cualquier cambio al motor de pagos (Fase 3, ya completada).
