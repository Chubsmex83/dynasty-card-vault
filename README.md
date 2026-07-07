# Dynasty Card Vault

Premium bilingual (ES/EN) e-commerce marketplace for collectible sports & TCG
cards, sealed boxes, memorabilia, and live-break spots.

**Live:** https://dynastycardvault.com

Built with **Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Framer
Motion · Zustand**, deployed on **Vercel**.

## Features

- **Marketplace** (`/shop`) with a filter sidebar (category, sport, grade,
  availability, price, sort) and a prominent live-autocomplete search.
  Categories are singles, sealed boxes, memorabilia, and accessories; sports
  span NBA/MLB/NFL/NHL, Pokémon, soccer, F1, UFC, One Piece, MTG, and Marvel.
- **Product detail** pages with a holographic card-art gallery, grading info, and
  Schema.org Product/Offer structured data.
- **Live Breaks** section with purchasable per-team/division spots.
- **Cart** (client-side, persisted to `localStorage`) with a working **checkout**
  (ES → Stripe/MXN, EN → PayPal/USD) — verified end-to-end in sandbox; see the
  payments section below.
- **Bilingual** Spanish (default) / English via an `[locale]` route segment and
  JSON dictionaries.
- **Signature design**: dark premium "vault" aesthetic with a cursor-reactive
  holographic foil tilt on cards and a graded-slab card frame.
- **Animated background** (`BackgroundFX`): a fixed brand-logo watermark plus a
  drifting electric-blue aurora, with an electric-blue glow that follows the
  cursor. Heavier content motion respects `prefers-reduced-motion`; the ambient
  background/cursor effects are intentionally always-on.
- **SEO / GEO**: per-page metadata, Open Graph + Twitter cards, JSON-LD
  (Organization, WebSite + SearchAction, Product, Offer, BreadcrumbList, FAQPage),
  `sitemap.xml`, `robots.txt`, semantic HTML, and concrete FAQ content.

Home sections: Hero → Featured → Sealed Boxes → Live Breaks → Why Us → FAQ.
The "Sealed Boxes" row shows the first 8 sealed boxes that have real product
photos (`getSealedBoxes()`), linking through to `/shop?category=sealed`.
Category browsing lives in the header nav and the `/shop` filters (there is no
dedicated category-tiles section on the home page).

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000  (redirects to /es)
npm run build    # production build
npm run test     # vitest unit tests (data layer, search, formatting, cart)
npm run lint
```

> **Windows note:** run `next` commands (`dev`/`build`/`lint`) from a path whose
> `Desktop` casing matches the real filesystem casing
> (`C:/Users/.../Desktop/...`). If the casing differs, webpack loads two copies
> of React and the build fails on internal error pages. Vercel's Linux build is
> unaffected.

## Project structure

```
app/[locale]/        Localized routes: home, shop, product/[slug], breaks, cart
components/           ui/ · motion/ · product/ · search/ · layout/ · breaks/ · cart/ · home/
lib/data/            Typed mock catalog + accessor functions (swap for a real API/CMS)
lib/cart/            Zustand cart store
lib/seo.ts           Metadata + JSON-LD builders
i18n/                Locale config + es/en dictionaries
```

## Data layer

All catalog reads go through `lib/data/` accessors (`getProducts`, `search`,
`getSealedBoxes`, `getBreaks`, …). Most of the catalog in `lib/data/products.ts`
is mock data with `images: []`, so a generated `<CardArt>` placeholder is
rendered. The sealed boxes and accessory added from real inventory point at
photos under `public/products/<sport>/…` and render via `next/image`. Populate
`images` on any other product (or swap in a real API/CMS) to replace the
placeholder — no UI changes required.

> **Note:** prices on the real sealed-box/accessory entries are placeholders
> (flagged with a comment in `products.ts`) pending the final price list.

## Environment

Copy `.env.example` to `.env.local` and set the values.

```
NEXT_PUBLIC_SITE_URL=https://dynastycardvault.com
```

`NEXT_PUBLIC_SITE_URL` is used for canonical URLs, `sitemap.xml`, and JSON-LD.
The payment/FX vars (`BANXICO_TOKEN`, `USD_MARGIN`, `STRIPE_*`, `PAYPAL_*`) power
the in-progress payments work below — see `.env.example` for the full annotated
list. `.env*` is gitignored (except `.env.example`), so secrets never land in
the repo.

## Payments & currency — WORK IN PROGRESS

Being built on branch **`feat/payments-phase2-currency`** (not yet merged to
`main`; production is untouched). Tracked phase-by-phase; full brief in
`Desktop/cartasnueva.txt`.

**Done so far**
- **Phase 1** — analysis of cart, pricing, i18n, layout, routing. ✅
- **Phase 2 (foundation)** — Banxico FIX exchange-rate service
  (`lib/fx/banxico.ts`, series `SF43718`, 24h cache + fallback), money helpers
  (`lib/money.ts`: `mxnToUsd`, MXN/USD formatters), `GET /api/fx` health check.
  Verified against live Banxico data; unit-tested. ✅
- **Phase 3 (gateways + checkout)** — end-to-end **sandbox checkout** built and
  verified. `resolveCharge` (`lib/checkout/resolveCharge.ts`) is the single
  server-side source of truth for amount + currency (the client sends only
  ids + quantities; prices are re-resolved from the catalog). ES pays in **MXN
  via Stripe Checkout** (redirect), EN pays in **USD via PayPal** buttons. Routes
  under `app/api/checkout/*` + a signature-verified `app/api/webhooks/stripe`;
  pages `app/[locale]/checkout` and `/checkout/success` (server-side confirmation).
  Both flows completed live against sandbox (Stripe test card + PayPal sandbox
  buyer). ✅
- **Phase 6 (legal pages)** — three bilingual pages at
  `app/[locale]/legal/{privacy,terms,sales}` (Privacy Notice, Terms &
  Conditions with a Live Breaks section, Sales & No-Returns Policy), built from
  a shared `LegalLayout` around per-locale content modules
  (`content/legal/<doc>.<locale>.tsx`), linked from a footer "Legal" column, plus
  a PROFECO purchase-transparency note on checkout. **The legal texts are
  lawyer-review templates** with a mandatory code-comment header and visible
  `[TODO]` placeholders for real business data — not for publishing as-is. ✅
- **Phase 7 (FAQ)** — payment-methods answer updated to the real gateways and a
  returns question added. ✅

**Pending**
- Finish Phase 2 display switch: base prices to **MXN** (`priceMXN`), ES shows
  MXN / EN shows USD via FIX×(1+margin); cart stores the MXN base. **Blocked on
  the client's final MXN price list** (isolated to `resolveCharge` — one swap
  point).
- Next sub-project (needs a datastore): **OXXO Pay** (pending payments) +
  durable order records; this also re-verifies the PayPal capture by id on the
  success page.
- Before publishing the legal pages: lawyer review + fill every `[TODO]` with
  the real fiscal/contact data.
- Go-live: swap sandbox keys for production, set the Stripe webhook secret.

> **Currency model:** prices are stored in **MXN** (reference). English store
> shows USD as `(MXN ÷ Banxico FIX) × (1 + USD_MARGIN)` (margin default 5%,
> configurable). The FIX refreshes at most once/day with a safe fallback so the
> USD price is never missing.

## Deployment

Deployed to Vercel (project `cartas`). The GoDaddy domain
`dynastycardvault.com` points at Vercel's nameservers
(`ns1/ns2.vercel-dns.com`); the apex is canonical and `www` 301-redirects to it.

The GitHub repo is connected to Vercel, so deploys are automatic:

- **Push to `main`** → production deploy (`dynastycardvault.com`).
- **Push to any other branch / open a PR** → a preview deploy with its own URL.

Manual deploys still work via the CLI: `vercel --prod`.
