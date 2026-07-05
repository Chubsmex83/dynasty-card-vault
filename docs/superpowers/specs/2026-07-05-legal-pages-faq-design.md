# Fase 6 (páginas legales) + Fase 7 (FAQ) — diseño

**Fecha:** 2026-07-05
**Rama:** `feat/payments-phase2-currency`
**Estado:** diseño aprobado, pendiente de plan de implementación

## Objetivo

Cumplir con la ley mexicana de e-commerce (PROFECO / INAI) publicando tres
páginas legales bilingües (ES/EN) enlazadas desde el footer, agregar la
transparencia de compra que exige PROFECO en el checkout, y actualizar el FAQ
para reflejar los métodos de pago reales (ya no "próximamente").

Los textos legales son **plantillas base** que deben ser revisadas por un
abogado antes de publicarse; el código lo deja explícito y los datos
fiscales/legales reales quedan como `[TODO]` visibles (nunca inventados).

## Alcance

- **3 páginas legales** (ES/EN): Aviso de Privacidad, Términos y Condiciones (con
  sección de Live Breaks), Política de Ventas y No Devoluciones.
- **Enlaces en el footer** (ambos idiomas).
- **Nota de transparencia PROFECO en el checkout**: métodos de pago aceptados,
  costos de envío y tiempos de entrega (datos reales como `[TODO]`), con enlace a
  las políticas.
- **FAQ actualizado**: método de pago real + una pregunta de devoluciones que
  enlaza a la política.

Fuera de alcance: revisión legal real (la hace un abogado), datos fiscales reales
(los pone el cliente en los `[TODO]`), y cualquier cambio al motor de pagos.

## Contexto del código

- **Rutas**: patrón `app/[locale]/<ruta>/page.tsx`, server components que usan
  `getDictionary(locale)` (ej. `app/[locale]/cart/page.tsx`). Slugs en inglés
  (`shop`, `breaks`, `cart`, `checkout`).
- **Footer** (`components/layout/Footer.tsx`): columnas Brand, Explore, Categories
  a partir de `dict.footer.*`. Hay un `dict.footer.company` = "Empresa" sin usar.
- **FAQ**: array `faq` en `i18n/dictionaries/{es,en}.json`; la última entrada hoy
  dice que los pagos están "próximamente".
- **Checkout**: `components/checkout/CheckoutView.tsx` ya muestra el resumen y un
  `dict.checkout.currencyNote`.
- **i18n**: el tipo `Dictionary` se infiere de `es.json`; ambos dicts deben tener
  las mismas claves.
- **SEO**: existe `lib/seo.ts` con builders de metadata; las páginas usan
  `generateMetadata`.

## Decisiones de diseño

### 1. Rutas separadas, slugs en inglés

Tres rutas independientes (estándar para legales, enlazables, buenas para SEO):

```
app/[locale]/legal/privacy/page.tsx   Aviso de Privacidad
app/[locale]/legal/terms/page.tsx     Términos y Condiciones (incl. Live Breaks)
app/[locale]/legal/sales/page.tsx     Política de Ventas y No Devoluciones
```

### 2. El texto legal vive en módulos de contenido, no en los JSON de i18n

La prosa legal es larga; meterla en los diccionarios JSON los inflaría y JSON es
pésimo para prosa con encabezados/listas. En su lugar:

```
content/legal/privacy.es.tsx   content/legal/privacy.en.tsx
content/legal/terms.es.tsx     content/legal/terms.en.tsx
content/legal/sales.es.tsx     content/legal/sales.en.tsx
```

Cada archivo exporta el cuerpo del documento como JSX (encabezados `<h2>`,
párrafos, listas). Un componente compartido `components/legal/LegalLayout.tsx`
provee el marco común: título, línea "Última actualización: [TODO]", ancho de
lectura y estilos de prosa. Cada `page.tsx` es un server component delgado que
elige el módulo de contenido por locale y lo mete en `LegalLayout`.

Los strings de UI (títulos de página, label "Legal" del footer, "Última
actualización") sí van en los diccionarios.

### 3. Aviso de abogado = comentario en código; datos reales = `[TODO]` visibles

- **Comentario prominente al inicio de cada archivo de `content/legal/`**:
  declara que el texto es una PLANTILLA que DEBE ser revisada por un abogado antes
  de publicarse, con énfasis en No Devoluciones y en la sección de Live Breaks.
  (Requisito textual del brief: el aviso va "al inicio del código".)
- **Sin banner visible** para el cliente final (decisión del usuario): no se
  muestra ningún cartel de "no revisado legalmente" en la página.
- **Datos fiscales/legales reales como placeholders visibles** en el texto
  renderizado: `[TODO: razón social]`, `[TODO: RFC]`, `[TODO: domicilio fiscal]`,
  `[TODO: correo de contacto]`, `[TODO: teléfono]`, `[TODO: tiempos de entrega]`.
  Nunca se inventan; su presencia deja claro que es borrador.

### 4. Contenido de cada documento (plantilla base, ES + EN)

- **Aviso de Privacidad** (INAI): identidad y domicilio del responsable
  (`[TODO]`), datos personales que se recaban, finalidades, transferencias,
  **derechos ARCO** y cómo ejercerlos, uso de cookies, y medio de contacto
  (`[TODO: correo]`).
- **Términos y Condiciones**: aceptación, uso del sitio, proceso de compra y
  pago, precios y moneda (MXN/USD), envíos, propiedad intelectual, limitación de
  responsabilidad, ley aplicable, y una **sección separada y claramente titulada
  "Live Breaks"**: cómo se compran los spots, qué recibe el comprador, y que los
  resultados dependen del contenido aleatorio de las cajas.
- **Política de Ventas y No Devoluciones**: todas las ventas son finales; no hay
  reembolsos por arrepentimiento/cambio de opinión en ningún producto (cartas,
  cajas, memorabilia, breaks). **Sección aparte marcada `[TODO: revisión
  legal]`** sobre producto **dañado, defectuoso o distinto a lo anunciado**, que
  NO niega los derechos que la ley mexicana pueda conservar al consumidor en esos
  casos (se deja el detalle al abogado).

### 5. Footer

Nueva columna **"Legal"** con los 3 enlaces (`/[locale]/legal/{privacy,terms,sales}`),
usando un label nuevo `dict.footer.legal` ("Legal" en ambos idiomas). Se agrega
como cuarta columna del grid existente.

### 6. Transparencia PROFECO en el checkout

En `CheckoutView` (bajo el resumen), un bloque de texto que declara: métodos de
pago aceptados (tarjetas Visa/MC/Amex, Apple Pay, Google Pay, PayPal), que el
envío tiene seguro incluido, el costo de envío y los tiempos de entrega
(`[TODO: costo de envío]`, `[TODO: tiempos de entrega]`), con enlaces a la
Política de Ventas y a los Términos. Strings en el diccionario (`dict.checkout.*`).

### 7. FAQ (Fase 7)

- Reescribir la respuesta de métodos de pago: tarjetas (Visa/MC/Amex), Apple Pay
  y Google Pay vía Stripe, y PayPal para pagos internacionales; MSI y OXXO como
  "según disponibilidad" (`[TODO: confirmar]`) para no sobreprometer.
- Agregar una pregunta de **devoluciones**: resume "todas las ventas son finales"
  y enlaza a `/[locale]/legal/sales`.

### 8. SEO

Cada página legal define `generateMetadata` con título y descripción vía
`lib/seo.ts` (patrón existente). Indexables. **No** se tocan
`sitemap.xml`/`robots.txt` en esta rebanada (fuera de alcance).

## Componentes / archivos

```
app/[locale]/legal/privacy/page.tsx      server component + generateMetadata
app/[locale]/legal/terms/page.tsx        server component + generateMetadata
app/[locale]/legal/sales/page.tsx        server component + generateMetadata
components/legal/LegalLayout.tsx          marco común (título, fecha, prosa)
content/legal/privacy.{es,en}.tsx         cuerpo del Aviso de Privacidad
content/legal/terms.{es,en}.tsx           cuerpo de Términos (incl. Live Breaks)
content/legal/sales.{es,en}.tsx           cuerpo de Ventas y No Devoluciones
components/layout/Footer.tsx              + columna Legal
components/checkout/CheckoutView.tsx      + nota de transparencia PROFECO
i18n/dictionaries/{es,en}.json            + claves UI (footer.legal, legal.*, checkout.*), FAQ actualizado
```

Cada unidad tiene un propósito único: los `page.tsx` orquestan; `LegalLayout`
da el marco; los `content/legal/*` son solo prosa; el diccionario tiene los
strings de UI. Se puede cambiar el texto de un documento sin tocar el layout ni
las rutas.

## Manejo de errores / edge cases

- Locale inválido: ya lo maneja el segmento `[locale]` existente.
- Un documento sin traducción para un locale no debe existir: los 6 archivos de
  contenido se crean en pareja ES/EN.

## Pruebas

- **Build/regresión**: `npm run build` (las páginas legales prerenderizan ES/EN),
  `npm run lint`, `npm run test` — sin romper lo existente. Correr desde la ruta
  con `Desktop` en mayúscula (nota Windows del README).
- **Verificación visual**: las 3 páginas en ES y EN renderizan con su contenido y
  los `[TODO]` visibles; los enlaces del footer llevan a cada página; la nota
  PROFECO aparece en el checkout; el FAQ muestra el método de pago real y la
  pregunta de devoluciones enlaza a la política.

## Riesgos / notas

- **No publicar sin revisión legal**: los `[TODO]` y el comentario en código lo
  hacen explícito; el go-live real depende del abogado y de los datos del cliente.
- **Consistencia de claves i18n**: cada clave nueva se agrega a ES y EN o el tipo
  `Dictionary` (inferido de `es.json`) rompe el type-check.
- **Tamaño de los diccionarios**: por eso la prosa larga va en `content/legal/`,
  no en los JSON.
