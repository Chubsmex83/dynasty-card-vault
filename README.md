# Dynasty Card Vault

Premium bilingual (ES/EN) e-commerce marketplace for collectible sports & TCG
cards, sealed boxes, memorabilia, and live-break spots.

**Live:** https://dynastycardvault.com

Built with **Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Framer
Motion · Zustand**, deployed on **Vercel**.

## Features

- **Marketplace** (`/shop`) with a filter sidebar (category, sport, grade,
  availability, price, sort) and a prominent live-autocomplete search.
- **Product detail** pages with a holographic card-art gallery, grading info, and
  Schema.org Product/Offer structured data.
- **Live Breaks** section with purchasable per-team/division spots.
- **Cart** (client-side, persisted to `localStorage`) — checkout is intentionally
  disabled until a payments backend is connected.
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

Home sections: Hero → Featured → New Arrivals → Live Breaks → Why Us → FAQ.
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
`getBreaks`, …). The catalog in `lib/data/products.ts` is mock data with
`images: []`, so a generated `<CardArt>` placeholder is rendered. Replace with a
real API/CMS or populate `images` with real photos — no UI changes required.

## Environment

Copy `.env.example` to `.env.local` and set:

```
NEXT_PUBLIC_SITE_URL=https://dynastycardvault.com
```

Used for canonical URLs, `sitemap.xml`, and JSON-LD.

## Deployment

Deployed to Vercel (project `cartas`). The GoDaddy domain
`dynastycardvault.com` points at Vercel's nameservers
(`ns1/ns2.vercel-dns.com`); the apex is canonical and `www` 301-redirects to it.
To deploy: `vercel --prod`.
