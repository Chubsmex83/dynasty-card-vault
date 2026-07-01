# Dynasty Card Vault — Design Spec

**Date:** 2026-07-01
**Status:** Approved for planning

## 1. Overview

Dynasty Card Vault is a premium e-commerce marketplace for collectible sports
and TCG cards. It sells four product categories: individual cards, sealed
boxes/packs, sports memorabilia, and spots in live box breaks. Visual references:
cardvaultbytombrady.com and elitium.mx (dark, product-centric, premium with
metallic accents). Sector UX references: Fanatics Collect, PWCC, Alt, StockX,
Whatnot.

Payments/backend are out of scope for v1 — the cart is a functional client-side
mock. The product catalog is mock data behind an abstracted data layer so a real
API/CMS can be connected later without touching UI. Card imagery is generated
"card-art" (holographic gradient + rendered metadata) for now; real photos will
replace them later via the same data layer.

## 2. Goals & Non-Goals

**Goals**
- Distinctive premium/futuristic look that does not read as generic AI output.
- Full marketplace flow: browse → search/filter → product detail → cart.
- Live breaks section with purchasable spots (mock).
- Bilingual ES/EN (Spanish default).
- Strong SEO + GEO (Google + LLM citeability).
- Optimized Core Web Vitals.
- Deliverable: verified build → local preview + user confirmation → GitHub → Vercel live URL.

**Non-Goals (v1)**
- Real payment processing, checkout, or auth.
- Real inventory / backend database.
- User accounts, order history, reviews.

## 3. Visual Direction (critical)

- **Palette:** Background `#0A0B0F` (near-black, blue-tinted) → panels `#12141C`.
  Text `#F5F6FA`, muted `#8A8F9C`. Primary accent champagne/gold `#C9A24B`.
  Secondary "holographic" accent: animated cyan→magenta→gold gradient, used with
  restraint (foil shine on featured cards, grade badges, logo mark only).
- **Typography:** Display face with character for headings (Space Grotesk via
  `next/font/google`), Inter for body. Strong hierarchy, negative tracking on
  large titles.
- **Motion (Emil Kowalski principles):** physical spring easing, not linear.
  Reveal-on-scroll with stagger, product cards that "breathe" on hover
  (lift + subtle 3D tilt + holographic sheen following the cursor), subtle hero
  parallax, cursor glow. All gated by `prefers-reduced-motion`.
- **Layout:** spacious marketplace/gallery grid; cards with breathing room and
  foil-shine on hover.

## 4. Tech Architecture

- **Next.js 15 (App Router) + TypeScript + Tailwind CSS + Framer Motion.**
- `next/image`, `next/font` for CWV.
- **i18n:** App Router `[locale]` segment (`es` default, `en`) with JSON
  dictionaries in `i18n/dictionaries/`. Lightweight, no heavy dependency.
  Language toggle in header persists choice.
- **Data layer:** `lib/data/` exposes `getProducts(filter)`, `getProductBySlug()`,
  `getFeatured()`, `getNewArrivals()`, `getMostValuable()`, `getBreaks()`,
  `getBreakBySlug()`, `search(query)`. Backed by typed mock catalog in `data/`
  (~80–100 products across categories + breaks). Implementation swappable for API.
- **Cart state:** Zustand + `localStorage` persistence (client only).
- **Card-art:** `<CardArt>` component renders holographic placeholder from product
  metadata (player, year, brand, grade, sport) — no external image dependency.
- **Component structure:** `components/ui/`, `components/product/`,
  `components/layout/`, `components/motion/`, `components/search/`.

## 5. Data Model (mock, typed)

```
Product {
  id, slug, name, category ('single'|'sealed'|'memorabilia'),
  sport ('nba'|'mlb'|'nfl'|'nhl'|'pokemon'|'soccer'|'f1'|'ufc'|'onepiece'|'mtg'),
  player?, team?, league?, year?, brand?, cardNumber?,
  grade? { company: 'PSA'|'BGS'|'SGC', value: number },
  price, currency, availability ('in_stock'|'sold_out'|'preorder'),
  images: string[]  // empty -> CardArt fallback
  featured?, newArrival?, valuation? (for "most valuable"),
  description
}

Break {
  id, slug, title, sport, breakType ('pyt'|'random'|'division'),
  boxes, startsAt (ISO string), status ('upcoming'|'live'|'completed'),
  spots: Spot[]
}
Spot { id, label (team/division), price, available: boolean }
```

## 6. Routes / Pages

- `/[locale]` **Home** — hero (parallax), prominent search, Featured, New Arrivals,
  Most Valuable, Breaks strip, category tiles, business/FAQ blocks (GEO).
- `/[locale]/shop` **Marketplace** — left filter sidebar (category, price range,
  grade PSA/BGS, availability, sport), live-autocomplete search, product grid,
  sort. Filters reflected in URL query params.
- `/[locale]/product/[slug]` **Detail** — image/CardArt gallery with zoom,
  grading info, price, add-to-cart CTA, related products, JSON-LD Product/Offer.
- `/[locale]/breaks` **Breaks** — list of breaks; each with spot grid by
  team/division, per-spot price, add-spot-to-cart.
- `/[locale]/cart` **Cart** — line items, quantity, totals, remove; mock checkout CTA.
- Category landing via `shop?category=` filters.

## 7. SEO / GEO

- Per-page `generateMetadata` (title, description, canonical, OG, Twitter cards).
- JSON-LD: Organization, WebSite + SearchAction, Product, Offer, BreadcrumbList.
- `app/sitemap.ts`, `app/robots.ts`.
- Semantic HTML, hierarchical headings, descriptive alt text.
- GEO: FAQ with concrete data + descriptive business/catalog copy structured for
  LLM citation.
- CWV: lazy loading, `next/image`, optimized fonts, minimal blocking JS.

## 8. Delivery

1. Implement + verify `next build` passes clean.
2. Run local dev, present preview, get user confirmation.
3. `git init`, commit, push to GitHub via `gh`.
4. Deploy to Vercel; return live URL.

## 9. Testing / Verification

- `next build` passes with no errors/type errors.
- Manual walkthrough of every route in ES and EN.
- Cart add/remove/persist works.
- Filters + autocomplete search return correct results.
- `prefers-reduced-motion` disables heavy motion.
- Lighthouse sanity check on Home + Product.
