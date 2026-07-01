# Dynasty Card Vault Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a premium bilingual (ES/EN) e-commerce marketplace for collectible sports/TCG cards, sealed boxes, memorabilia, and live-break spots, with mock data behind a swappable data layer, a functional client-side cart, strong SEO/GEO, and deploy to Vercel.

**Architecture:** Next.js 15 App Router with a `[locale]` route segment. UI is componentized (ui/layout/product/search/motion). A typed mock catalog in `data/` is read only through `lib/data/` accessor functions (swappable for a real API later). Cart is a Zustand store persisted to localStorage. Card imagery is a generated `<CardArt>` placeholder component. Motion via Framer Motion, gated by `prefers-reduced-motion`.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, Zustand, next/font (Space Grotesk + Inter), Vitest for unit tests.

## Global Constraints

- Framework: Next.js 15+ App Router, TypeScript strict mode, React 19.
- Styling: Tailwind CSS only (no other CSS frameworks).
- Animation: Framer Motion; every non-trivial motion must respect `prefers-reduced-motion`.
- State: Zustand for cart; persisted to `localStorage`.
- i18n: `es` (default) and `en`; all user-facing copy comes from dictionaries — no hardcoded UI strings in components.
- Data: all catalog reads go through `lib/data/` accessors; components never import `data/*` files directly.
- Brand: "Dynasty Card Vault". Palette bg `#0A0B0F`, panel `#12141C`, text `#F5F6FA`, muted `#8A8F9C`, gold `#C9A24B`.
- Fonts: Space Grotesk (display), Inter (body) via `next/font/google`.
- Images: use `next/image`; card grid uses `<CardArt>` when `images` is empty.
- Currency: prices in USD, formatted with Intl per locale.
- Build: `next build` must pass with zero type/lint errors before delivery.

---

## File Structure

```
package.json, tsconfig.json, next.config.ts, tailwind.config.ts,
postcss.config.mjs, vitest.config.ts, .gitignore, .eslintrc

app/
  layout.tsx                      # root <html>, fonts, metadata base
  globals.css                     # Tailwind + design tokens + keyframes
  robots.ts, sitemap.ts
  [locale]/
    layout.tsx                    # locale provider, header, footer, JSON-LD Org+WebSite
    page.tsx                      # Home
    shop/page.tsx                 # Marketplace (filters + grid + search)
    product/[slug]/page.tsx       # Product detail
    breaks/page.tsx               # Breaks list + spots
    cart/page.tsx                 # Cart

i18n/
  config.ts                       # locales, defaultLocale
  dictionaries/es.json, en.json
  getDictionary.ts

lib/
  data/
    types.ts                      # Product, Break, Spot, filter types
    products.ts                   # ~90 mock products
    breaks.ts                     # mock breaks
    index.ts                      # accessor functions (getProducts, search, ...)
  cart/store.ts                   # Zustand cart store
  format.ts                       # price/date formatting
  seo.ts                          # JSON-LD builders, metadata helpers
  utils.ts                        # cn() + misc

components/
  ui/            Button, Badge, Input, PriceTag, GradeBadge, Select, Skeleton
  layout/        Header, Footer, LocaleSwitcher, CartButton, MobileNav
  motion/        Reveal, CursorGlow, MotionCard, useReducedMotion helpers
  product/       CardArt, ProductCard, ProductGrid, ProductGallery, RelatedProducts
  search/        SearchBar (autocomplete), Filters (sidebar)
  breaks/        BreakCard, SpotGrid
  home/          Hero, SectionRow, CategoryTiles, FaqSection, ValueProps

tests/
  data.test.ts, cart.test.ts, format.test.ts, search.test.ts
```

---

### Task 1: Project scaffold + tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `.gitignore`, `.eslintrc.json`, `app/globals.css`, `app/layout.tsx`

**Interfaces:**
- Produces: working Next.js 15 app that builds; Tailwind design tokens available as CSS vars and Tailwind colors (`bg`, `panel`, `ink`, `muted`, `gold`); Vitest runner configured.

- [ ] **Step 1: Scaffold Next.js app non-interactively**

Run in project root:
```bash
npx --yes create-next-app@latest . --ts --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm --turbopack --yes
```
If the directory is non-empty (docs/ exists), scaffold in a temp dir and copy, OR answer prompts with `--yes`. Expected: Next.js project files created alongside `docs/`.

- [ ] **Step 2: Add dependencies**

```bash
npm install framer-motion zustand
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom
```

- [ ] **Step 3: Configure design tokens in `app/globals.css`**

Add CSS variables and base styles after the Tailwind import:
```css
:root{
  --bg:#0A0B0F; --panel:#12141C; --ink:#F5F6FA; --muted:#8A8F9C; --gold:#C9A24B;
  --holo:linear-gradient(115deg,#3DE7FF,#B36BFF,#C9A24B);
}
html,body{background:var(--bg);color:var(--ink);}
@media (prefers-reduced-motion: reduce){
  *{animation-duration:0.001ms!important;transition-duration:0.001ms!important;}
}
```
Map tokens in `tailwind.config.ts` under `theme.extend.colors`: `bg`, `panel`, `ink`, `muted`, `gold`.

- [ ] **Step 4: Configure fonts in `app/layout.tsx`**

Use `next/font/google` to load `Space_Grotesk` (var `--font-display`) and `Inter` (var `--font-body`); apply variables to `<html>`. Export `metadata` base with `metadataBase` and default title template `%s | Dynasty Card Vault`.

- [ ] **Step 5: Add `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins:[react()],
  test:{ environment:'jsdom', globals:true },
  resolve:{ alias:{ '@': new URL('.', import.meta.url).pathname } },
})
```
Add `"test": "vitest run"` to package.json scripts.

- [ ] **Step 6: Verify build + test runner**

Run: `npm run build` → Expected: build succeeds. Run: `npm run test` → Expected: "No test files found" (exit 0 acceptable) or passes.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js app with tokens, fonts, vitest"
```

---

### Task 2: Data types + mock catalog + accessors (TDD)

**Files:**
- Create: `lib/data/types.ts`, `lib/data/products.ts`, `lib/data/breaks.ts`, `lib/data/index.ts`, `tests/data.test.ts`

**Interfaces:**
- Produces:
  - Types: `Sport`, `Category`, `Availability`, `Grade`, `Product`, `Spot`, `Break`, `ProductFilter`.
  - `getProducts(filter?: ProductFilter): Product[]`
  - `getProductBySlug(slug: string): Product | undefined`
  - `getFeatured(): Product[]`, `getNewArrivals(): Product[]`, `getMostValuable(): Product[]`
  - `getBreaks(): Break[]`, `getBreakBySlug(slug): Break | undefined`
  - `getRelated(product: Product, n?: number): Product[]`
  - `ProductFilter = { category?: Category; sport?: Sport; grade?: 'PSA'|'BGS'|'SGC'; minPrice?: number; maxPrice?: number; availability?: Availability; sort?: 'price_asc'|'price_desc'|'newest'|'value' }`

- [ ] **Step 1: Write `lib/data/types.ts`**

Define exact types from spec §5. `Product.images: string[]` (empty ⇒ CardArt). `Grade = { company:'PSA'|'BGS'|'SGC'; value:number }`. Include `slug` on Product and Break.

- [ ] **Step 2: Write the failing test `tests/data.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { getProducts, getProductBySlug, getFeatured, getBreaks } from '@/lib/data'

describe('data layer', () => {
  it('returns a non-trivial catalog', () => {
    expect(getProducts().length).toBeGreaterThanOrEqual(60)
  })
  it('filters by category and sport', () => {
    const r = getProducts({ category:'single', sport:'nba' })
    expect(r.every(p => p.category==='single' && p.sport==='nba')).toBe(true)
  })
  it('filters by price range', () => {
    const r = getProducts({ minPrice:100, maxPrice:500 })
    expect(r.every(p => p.price>=100 && p.price<=500)).toBe(true)
  })
  it('sorts by price ascending', () => {
    const r = getProducts({ sort:'price_asc' })
    for (let i=1;i<r.length;i++) expect(r[i].price).toBeGreaterThanOrEqual(r[i-1].price)
  })
  it('looks up by slug', () => {
    const first = getProducts()[0]
    expect(getProductBySlug(first.slug)?.id).toBe(first.id)
  })
  it('featured and breaks are populated', () => {
    expect(getFeatured().length).toBeGreaterThan(0)
    expect(getBreaks().length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test` → Expected: FAIL (module `@/lib/data` not found).

- [ ] **Step 4: Write mock catalog `lib/data/products.ts`**

Export `products: Product[]` with ~90 items spanning categories (`single`, `sealed`, `memorabilia`) and all sports (`nba,mlb,nfl,nhl,pokemon,soccer,f1,ufc,onepiece,mtg`). Realistic names (e.g. "2003 Topps Chrome LeBron James Rookie #111"), brands (Panini, Topps, Upper Deck, Pokémon), grades, prices `$5–$25,000`, unique slugs, `featured`/`newArrival` flags, `valuation` on high-end items, `images: []`, a 1–2 sentence `description` each. Keep as plain data (no Date.now — use literal ISO strings for any dates).

- [ ] **Step 5: Write mock breaks `lib/data/breaks.ts`**

Export `breaks: Break[]` (≥6): PYT/random/division types, box lists, literal ISO `startsAt`, `status`, and `spots` arrays (teams for division/PYT breaks) with prices and `available` flags.

- [ ] **Step 6: Write accessors `lib/data/index.ts`**

Implement all Interface functions as pure functions over `products`/`breaks`. `getMostValuable` sorts by `valuation ?? price` desc. `getRelated` matches same sport/category excluding self. No React, no async.

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test` → Expected: PASS (all data tests green).

- [ ] **Step 8: Commit**

```bash
git add lib/data tests/data.test.ts && git commit -m "feat: mock catalog and data accessors with tests"
```

---

### Task 3: Formatting + search helpers (TDD)

**Files:**
- Create: `lib/format.ts`, `lib/utils.ts`, `tests/format.test.ts`, `tests/search.test.ts`
- Modify: `lib/data/index.ts` (add `search`)

**Interfaces:**
- Produces:
  - `formatPrice(cents_or_number: number, locale: 'es'|'en'): string`
  - `formatDate(iso: string, locale: 'es'|'en'): string`
  - `cn(...classes): string`
  - `search(query: string, limit?: number): Product[]` (matches name, player, team, league, year, brand, cardNumber; case-insensitive)

- [ ] **Step 1: Write failing tests**

`tests/format.test.ts`:
```ts
import { describe,it,expect } from 'vitest'
import { formatPrice } from '@/lib/format'
it('formats USD', () => {
  expect(formatPrice(1200,'en')).toMatch(/\$1,200/)
})
```
`tests/search.test.ts`:
```ts
import { describe,it,expect } from 'vitest'
import { search } from '@/lib/data'
it('finds by player name case-insensitively', () => {
  const r = search('lebron')
  expect(r.some(p => /lebron/i.test(p.name+ (p.player??'')))).toBe(true)
})
it('respects limit', () => {
  expect(search('a', 5).length).toBeLessThanOrEqual(5)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test` → Expected: FAIL (missing `formatPrice`/`search`).

- [ ] **Step 3: Implement `lib/format.ts` and `lib/utils.ts`**

`formatPrice` uses `Intl.NumberFormat(locale==='es'?'es-MX':'en-US',{style:'currency',currency:'USD'})`. `formatDate` uses `Intl.DateTimeFormat`. `cn` joins truthy class strings.

- [ ] **Step 4: Implement `search` in `lib/data/index.ts`**

Lowercase query; score/filter products whose concatenated searchable fields include the query; slice to `limit ?? 8`.

- [ ] **Step 5: Run tests to verify pass**

Run: `npm run test` → Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib tests && git commit -m "feat: formatting + product search with tests"
```

---

### Task 4: Cart store (TDD)

**Files:**
- Create: `lib/cart/store.ts`, `tests/cart.test.ts`

**Interfaces:**
- Produces: `useCart` Zustand store with state `{ items: CartItem[] }` and actions `addItem(entry)`, `removeItem(id)`, `setQty(id, qty)`, `clear()`, plus selector helpers `cartCount(state)` and `cartTotal(state)`.
- `CartItem = { id:string; kind:'product'|'spot'; name:string; price:number; qty:number; meta?:Record<string,string> }`. Adding an existing id increments qty. Persisted to `localStorage` key `dcv-cart`.

- [ ] **Step 1: Write failing test `tests/cart.test.ts`**

```ts
import { describe,it,expect,beforeEach } from 'vitest'
import { useCart, cartCount, cartTotal } from '@/lib/cart/store'

beforeEach(()=> useCart.getState().clear())
it('adds and increments', () => {
  const { addItem } = useCart.getState()
  addItem({ id:'p1', kind:'product', name:'X', price:100 })
  addItem({ id:'p1', kind:'product', name:'X', price:100 })
  expect(cartCount(useCart.getState())).toBe(2)
  expect(cartTotal(useCart.getState())).toBe(200)
})
it('removes and sets qty', () => {
  const { addItem, setQty, removeItem } = useCart.getState()
  addItem({ id:'p2', kind:'product', name:'Y', price:50 })
  setQty('p2', 3); expect(cartTotal(useCart.getState())).toBe(150)
  removeItem('p2'); expect(cartCount(useCart.getState())).toBe(0)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test` → Expected: FAIL (missing store).

- [ ] **Step 3: Implement `lib/cart/store.ts`**

Zustand `create` with `persist` middleware (name `dcv-cart`, `skipHydration` safe for SSR). `addItem` pushes or increments qty; `setQty` clamps ≥1; selectors compute count/total. Export `useCart`, `cartCount`, `cartTotal`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test` → Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/cart tests/cart.test.ts && git commit -m "feat: persisted cart store with tests"
```

---

### Task 5: i18n plumbing + locale routing

**Files:**
- Create: `i18n/config.ts`, `i18n/getDictionary.ts`, `i18n/dictionaries/es.json`, `i18n/dictionaries/en.json`, `app/[locale]/layout.tsx`
- Modify: `next.config.ts` (none needed), `app/layout.tsx` (keep root)
- Delete: `app/page.tsx` (default scaffold) — content moves under `[locale]`

**Interfaces:**
- Produces:
  - `locales = ['es','en'] as const`, `defaultLocale = 'es'`, `type Locale`.
  - `getDictionary(locale: Locale): Promise<Dict>` where `Dict` covers nav, home, shop, product, breaks, cart, footer, faq keys.
  - `generateStaticParams` on `[locale]` returning both locales.
  - Root `/` redirects to `/es`.

- [ ] **Step 1: Write `i18n/config.ts` and dictionaries**

Define locales + `Dict` shape. Populate `es.json` and `en.json` with all UI strings (nav labels, section titles "Destacados/Featured", CTAs "Agregar al carrito/Add to cart", filter labels, FAQ Q&A, footer, business description).

- [ ] **Step 2: Write `i18n/getDictionary.ts`**

```ts
import 'server-only'
import type { Locale } from './config'
const dicts = { es:()=>import('./dictionaries/es.json').then(m=>m.default),
                en:()=>import('./dictionaries/en.json').then(m=>m.default) }
export const getDictionary = (l:Locale)=> dicts[l]()
```

- [ ] **Step 3: Create `app/[locale]/layout.tsx`**

`generateStaticParams` → `[{locale:'es'},{locale:'en'}]`. Load dictionary, render `<Header/>` + `{children}` + `<Footer/>`. Emit Organization + WebSite(SearchAction) JSON-LD (from `lib/seo.ts`, Task 9). Validate locale param (404 on unknown).

- [ ] **Step 4: Redirect root to default locale**

Replace `app/page.tsx` with a redirect to `/es`, or add `app/page.tsx` doing `redirect('/es')`. Ensure no duplicate route conflict.

- [ ] **Step 5: Verify**

Run: `npm run build` → Expected: builds; `/es` and `/en` routes generated. Manually: `npm run dev`, load `/` → redirects to `/es`.

- [ ] **Step 6: Commit**

```bash
git add i18n app && git commit -m "feat: i18n dictionaries and locale routing"
```

---

### Task 6: Motion primitives + UI kit

**Files:**
- Create: `components/motion/Reveal.tsx`, `components/motion/CursorGlow.tsx`, `components/motion/MotionCard.tsx`, `components/ui/Button.tsx`, `components/ui/Badge.tsx`, `components/ui/PriceTag.tsx`, `components/ui/GradeBadge.tsx`, `components/ui/Input.tsx`, `components/ui/Select.tsx`, `components/ui/Skeleton.tsx`

**Interfaces:**
- Produces:
  - `<Reveal delay?>` — wraps children, fades+rises into view on scroll (Framer `whileInView`), disabled under reduced motion.
  - `<CursorGlow>` — client component, soft radial glow following cursor (pointer-fine only).
  - `<MotionCard>` — hover lift + subtle 3D tilt + holographic sheen; props `{ className, children }`.
  - `<Button variant='primary'|'ghost'|'gold' size?>`, `<Badge>`, `<PriceTag price locale>`, `<GradeBadge grade>`, `<Input>`, `<Select>`, `<Skeleton>`.

- [ ] **Step 1: Implement motion primitives**

`Reveal` uses `motion.div` with `initial/whileInView/viewport={{once:true}}`; reads `useReducedMotion()` to no-op. `MotionCard` tracks pointer via `useMotionValue` + `useTransform` for rotateX/rotateY and a `background` sheen; clamps and springs; reduced-motion → static. `CursorGlow` positions a fixed blurred radial div.

- [ ] **Step 2: Implement UI kit**

Each component styled with tokens (gold accents, panel backgrounds, rounded-2xl, focus-visible rings). `PriceTag` uses `formatPrice`. `GradeBadge` shows e.g. "PSA 10" with holo border for 9.5+.

- [ ] **Step 3: Verify render**

Run: `npm run build` → Expected: compiles, no type errors.

- [ ] **Step 4: Commit**

```bash
git add components && git commit -m "feat: motion primitives and UI kit"
```

---

### Task 7: CardArt + product cards + grid

**Files:**
- Create: `components/product/CardArt.tsx`, `components/product/ProductCard.tsx`, `components/product/ProductGrid.tsx`

**Interfaces:**
- Consumes: `Product`, `MotionCard`, `GradeBadge`, `PriceTag`, `getRelated`.
- Produces:
  - `<CardArt product size?>` — deterministic holographic placeholder derived from `product` (sport-based hue, brand/player/year/grade rendered as SVG/CSS). No external image. Used when `product.images.length===0`.
  - `<ProductCard product locale>` — links to `/[locale]/product/[slug]`, shows CardArt or `next/image`, name, grade, price, availability, add-to-cart button (calls `useCart.addItem`).
  - `<ProductGrid products locale>` — responsive gallery grid with `<Reveal>` stagger.

- [ ] **Step 1: Implement `CardArt`**

Deterministic: pick hue from `product.sport`; render layered gradients + subtle grid + the player/year/brand/cardNumber text and a foil sheen. Accept `size='grid'|'hero'|'detail'`. Include descriptive `aria-label`.

- [ ] **Step 2: Implement `ProductCard` and `ProductGrid`**

Card wraps `MotionCard`; footer has `PriceTag` + gold add-to-cart `Button` (client handler → `addItem({id,kind:'product',name,price})`). Grid maps products inside `<Reveal>` with incremental delay; responsive `grid-cols-2 md:3 lg:4`.

- [ ] **Step 3: Verify**

Run: `npm run build` → Expected: compiles.

- [ ] **Step 4: Commit**

```bash
git add components/product && git commit -m "feat: CardArt, product card and grid"
```

---

### Task 8: Header, Footer, LocaleSwitcher, CartButton

**Files:**
- Create: `components/layout/Header.tsx`, `components/layout/Footer.tsx`, `components/layout/LocaleSwitcher.tsx`, `components/layout/CartButton.tsx`, `components/layout/MobileNav.tsx`

**Interfaces:**
- Consumes: dictionary (`Dict`), `useCart`/`cartCount`, `locales`.
- Produces: `<Header dict locale>` (logo mark with holo accent, category nav with dropdown, prominent `<SearchBar>` slot, `<LocaleSwitcher>`, `<CartButton>`), `<Footer dict locale>` (business description for GEO, links, categories), responsive `<MobileNav>`.

- [ ] **Step 1: Implement Header + MobileNav**

Sticky, translucent panel bg with blur. Desktop nav (Cartas, Sealed, Memorabilia, Breaks) each linking to `shop?category=`. Mobile hamburger → `MobileNav` drawer (Framer slide). Include SearchBar (Task 10) placeholder import.

- [ ] **Step 2: Implement LocaleSwitcher + CartButton**

`LocaleSwitcher` swaps the leading locale segment in current path (`usePathname`). `CartButton` shows `cartCount` badge, links to `/[locale]/cart`; badge only renders after mount (avoid hydration mismatch).

- [ ] **Step 3: Implement Footer**

Include a concise descriptive business paragraph (GEO), category links, locale-aware copy, `© 2026 Dynasty Card Vault`.

- [ ] **Step 4: Verify**

Run: `npm run build` → Expected: compiles. Dev: header/footer render on `/es`.

- [ ] **Step 5: Commit**

```bash
git add components/layout && git commit -m "feat: header, footer, locale switcher, cart button"
```

---

### Task 9: SEO helpers (metadata + JSON-LD)

**Files:**
- Create: `lib/seo.ts`, `app/robots.ts`, `app/sitemap.ts`

**Interfaces:**
- Consumes: `getProducts`, `getBreaks`, `locales`.
- Produces:
  - `orgJsonLd()`, `websiteJsonLd(locale)`, `productJsonLd(product, locale)`, `breadcrumbJsonLd(items)`.
  - `pageMetadata({title,description,path,locale,image?}): Metadata` helper.
  - `app/robots.ts` (allow all, point to sitemap), `app/sitemap.ts` (home, shop, breaks, cart, all product slugs × both locales).

- [ ] **Step 1: Implement `lib/seo.ts`**

JSON-LD builders return plain objects. `websiteJsonLd` includes `potentialAction` SearchAction targeting `/{locale}/shop?q={search_term_string}`. `productJsonLd` maps to schema.org Product + Offer (price, priceCurrency USD, availability URL).

- [ ] **Step 2: Implement `app/robots.ts` and `app/sitemap.ts`**

`sitemap()` iterates `getProducts()` slugs and static routes for `es`+`en`, returns `MetadataRoute.Sitemap`. Use a constant `SITE_URL` (env `NEXT_PUBLIC_SITE_URL` fallback to `https://dynastycardvault.vercel.app`).

- [ ] **Step 3: Wire Organization+WebSite JSON-LD into `app/[locale]/layout.tsx`**

Inject `<script type="application/ld+json">` for `orgJsonLd()` and `websiteJsonLd(locale)`.

- [ ] **Step 4: Verify**

Run: `npm run build` → Expected: compiles; `/sitemap.xml` and `/robots.txt` generated.

- [ ] **Step 5: Commit**

```bash
git add lib/seo.ts app/robots.ts app/sitemap.ts app/[locale]/layout.tsx && git commit -m "feat: SEO metadata, JSON-LD, sitemap, robots"
```

---

### Task 10: SearchBar with live autocomplete

**Files:**
- Create: `components/search/SearchBar.tsx`
- Modify: `components/layout/Header.tsx` (mount SearchBar)

**Interfaces:**
- Consumes: `search(query)`, `formatPrice`.
- Produces: `<SearchBar dict locale>` — controlled input; on input (debounced ~150ms) calls `search()` and renders a dropdown of up to 8 suggestions (CardArt thumb + name + price) linking to product detail; Enter navigates to `shop?q=`; keyboard up/down/escape support; closes on outside click.

- [ ] **Step 1: Implement SearchBar**

Client component; local state for query + results; debounce via `setTimeout` cleared on change (no timers at module scope). Results computed by `search(query, 8)`. Accessible combobox roles.

- [ ] **Step 2: Mount in Header**

Replace placeholder with `<SearchBar>`; prominent full-width on desktop, toggle on mobile.

- [ ] **Step 3: Verify**

Run: `npm run build`; dev: typing "lebron" shows suggestions. Expected: dropdown updates live.

- [ ] **Step 4: Commit**

```bash
git add components/search components/layout/Header.tsx && git commit -m "feat: live autocomplete search bar"
```

---

### Task 11: Filters sidebar + Shop page

**Files:**
- Create: `components/search/Filters.tsx`, `app/[locale]/shop/page.tsx`

**Interfaces:**
- Consumes: `getProducts(filter)`, `ProductFilter`, `ProductGrid`, `Filters`.
- Produces:
  - `<Filters dict locale value onChange>` — controls for category, sport, grade, availability, price range, sort.
  - Shop page reads `searchParams` (`category, sport, grade, availability, minPrice, maxPrice, sort, q`), builds `ProductFilter`, renders sidebar + grid + result count. Filters update the URL (client) so state is shareable.

- [ ] **Step 1: Implement Filters (client)**

Left sidebar (collapsible on mobile). Uses `useRouter`/`useSearchParams` to push updated query params; `q` from search is preserved. Debounce price inputs.

- [ ] **Step 2: Implement Shop page (server)**

Parse `searchParams` into `ProductFilter`; if `q` present, intersect with `search(q)` results. Render `generateMetadata` (localized title/description), breadcrumb JSON-LD, `<Filters>` + `<ProductGrid>` + empty-state.

- [ ] **Step 3: Verify**

Run: `npm run build`; dev: `/es/shop?category=single&sport=nba&sort=price_asc` filters and sorts correctly.

- [ ] **Step 4: Commit**

```bash
git add components/search/Filters.tsx app/[locale]/shop && git commit -m "feat: marketplace shop page with filters"
```

---

### Task 12: Product detail page + gallery

**Files:**
- Create: `components/product/ProductGallery.tsx`, `components/product/RelatedProducts.tsx`, `app/[locale]/product/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getProductBySlug`, `getRelated`, `productJsonLd`, `breadcrumbJsonLd`, `CardArt`, cart store.
- Produces:
  - `<ProductGallery product>` — main CardArt/image with hover-zoom + thumbnails.
  - `<RelatedProducts product locale>` — grid of related items.
  - Detail page: `generateStaticParams` for all slugs (optional), `generateMetadata` per product (OG image, description), layout with gallery + info (name, grade, brand/year/sport, price, availability, add-to-cart CTA), grading info block, JSON-LD Product/Offer + BreadcrumbList.

- [ ] **Step 1: Implement ProductGallery + RelatedProducts**

Gallery: hover magnifier (transform-scale on pointer, disabled reduced-motion). Related uses `ProductGrid`.

- [ ] **Step 2: Implement detail page**

404 via `notFound()` on missing slug. Add-to-cart is a client subcomponent calling `addItem`. Include grading explainer + descriptive copy for GEO.

- [ ] **Step 3: Verify**

Run: `npm run build`; dev: open a product; add to cart increments badge; JSON-LD present in HTML.

- [ ] **Step 4: Commit**

```bash
git add components/product app/[locale]/product && git commit -m "feat: product detail page with gallery and schema"
```

---

### Task 13: Breaks page + spots

**Files:**
- Create: `components/breaks/BreakCard.tsx`, `components/breaks/SpotGrid.tsx`, `app/[locale]/breaks/page.tsx`

**Interfaces:**
- Consumes: `getBreaks`, `formatDate`, cart store.
- Produces:
  - `<BreakCard break locale>` — title, type, boxes, start time, status badge, spot summary.
  - `<SpotGrid break locale>` — grid of team/division spots with price; available spots add to cart (`kind:'spot'`, id=`break.id+':'+spot.id`), taken spots disabled.
  - Breaks page: intro copy, list of breaks each expandable to its `SpotGrid`; localized `generateMetadata`.

- [ ] **Step 1: Implement BreakCard + SpotGrid**

SpotGrid buttons call `addItem({id, kind:'spot', name:`${break.title} — ${spot.label}`, price:spot.price})`; disabled when `!spot.available`.

- [ ] **Step 2: Implement Breaks page**

Server component; map `getBreaks()`; upcoming/live badges via status. Descriptive section for GEO.

- [ ] **Step 3: Verify**

Run: `npm run build`; dev: add a spot → appears in cart.

- [ ] **Step 4: Commit**

```bash
git add components/breaks app/[locale]/breaks && git commit -m "feat: live breaks page with purchasable spots"
```

---

### Task 14: Cart page

**Files:**
- Create: `app/[locale]/cart/page.tsx`, `components/cart/CartView.tsx`

**Interfaces:**
- Consumes: `useCart`, `cartTotal`, `formatPrice`.
- Produces: `<CartView dict locale>` — client component listing items (name, meta, qty stepper, line total, remove), order summary with total, disabled "Checkout (próximamente)" CTA, empty state linking to shop.

- [ ] **Step 1: Implement CartView**

Qty stepper calls `setQty`; remove calls `removeItem`; guard hydration (render after mount). Empty-state message + CTA to `/[locale]/shop`.

- [ ] **Step 2: Implement cart page**

Server wrapper sets `generateMetadata` (noindex), renders `<CartView>`.

- [ ] **Step 3: Verify**

Run: `npm run build`; dev: add items, adjust qty, remove, reload → persists.

- [ ] **Step 4: Commit**

```bash
git add app/[locale]/cart components/cart && git commit -m "feat: cart page"
```

---

### Task 15: Home page

**Files:**
- Create: `components/home/Hero.tsx`, `components/home/SectionRow.tsx`, `components/home/CategoryTiles.tsx`, `components/home/ValueProps.tsx`, `components/home/FaqSection.tsx`, `app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `getFeatured`, `getNewArrivals`, `getMostValuable`, `getBreaks`, `ProductGrid`/`ProductCard`, dictionary.
- Produces:
  - `<Hero dict locale>` — parallax headline, holographic accent, prominent search CTA, floating CardArt visuals.
  - `<SectionRow title products locale>` — labeled horizontal/section product row.
  - `<CategoryTiles>`, `<ValueProps>` (grading/authenticity/secure), `<FaqSection>` (concrete Q&A for GEO).
  - Home page assembles: Hero → Featured → New Arrivals → Most Valuable → Breaks strip → CategoryTiles → ValueProps → FAQ. Localized metadata + WebSite JSON-LD already in layout.

- [ ] **Step 1: Implement Hero with subtle parallax**

Framer scroll-linked transform on background/CardArt layers; reduced-motion static. Include search entry (links to shop) and gold CTA.

- [ ] **Step 2: Implement SectionRow, CategoryTiles, ValueProps, FaqSection**

FAQ pulls Q&A from dictionary (concrete data: grading companies, shipping, authenticity). Emit FAQPage JSON-LD.

- [ ] **Step 3: Assemble Home page**

Compose sections with `<Reveal>`; `generateMetadata` localized.

- [ ] **Step 4: Verify**

Run: `npm run build`; dev: home renders all sections in ES and EN.

- [ ] **Step 5: Commit**

```bash
git add components/home app/[locale]/page.tsx && git commit -m "feat: home page with hero, sections, FAQ"
```

---

### Task 16: Polish, responsive QA, accessibility, build gate

**Files:**
- Modify: various components as needed; `app/globals.css`

**Interfaces:** none new.

- [ ] **Step 1: Responsive pass**

Verify mobile-first at 375/768/1280 for Home, Shop, Product, Breaks, Cart. Fix overflow, tap targets, mobile nav/search.

- [ ] **Step 2: Accessibility + reduced motion**

Check headings hierarchy, alt/aria labels on CardArt, focus-visible, color contrast on gold text, and that `prefers-reduced-motion` disables tilt/parallax/glow.

- [ ] **Step 3: Full test + build gate**

Run: `npm run test` → Expected: all pass. Run: `npm run lint` → Expected: clean. Run: `npm run build` → Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: responsive, a11y, reduced-motion polish"
```

---

### Task 17: Local preview + user confirmation

**Files:** none.

- [ ] **Step 1: Start dev server**

Run: `npm run dev`; provide the local URL. Walk through Home/Shop/Product/Breaks/Cart in ES and EN.

- [ ] **Step 2: Present preview and STOP for confirmation**

Explicitly ask the user to confirm before any GitHub/Vercel step. Do not proceed without approval.

---

### Task 18: GitHub + Vercel deploy (after confirmation)

**Files:** Create: `README.md`, `.env.example`

**Interfaces:** none.

- [ ] **Step 1: Write README + .env.example**

README: project overview, stack, run/build commands, data-layer swap note, i18n note. `.env.example`: `NEXT_PUBLIC_SITE_URL=`.

- [ ] **Step 2: Create GitHub repo and push**

```bash
gh repo create dynasty-card-vault --public --source . --remote origin --push
```
Expected: repo created, code pushed. (Confirm `gh auth status` first.)

- [ ] **Step 3: Deploy to Vercel**

```bash
vercel --yes            # link + preview
vercel --prod --yes     # production
```
Set `NEXT_PUBLIC_SITE_URL` env in Vercel to the production URL, redeploy if needed. (Confirm `vercel whoami` / CLI installed first; if not installed, instruct `npm i -g vercel` and `vercel login`.)

- [ ] **Step 4: Verify live**

Load the production URL; confirm Home, a product, and Shop render; build shows success in Vercel. Return the live URL to the user.

---

## Self-Review Notes

- **Spec coverage:** categories (Task 2), search/autocomplete (10), filters (11), product detail w/ zoom+grading (12), featured/new/most-valuable rows (15), breaks w/ spots (13), cart (4,14), responsive (16), i18n (5), SEO/GEO metadata+JSON-LD+sitemap+robots+FAQ (9,15), CWV via next/image+next/font (1,7), delivery preview→GitHub→Vercel (17,18). All spec sections mapped.
- **Placeholders:** none — each code step shows concrete code or exact commands.
- **Type consistency:** `Product`, `ProductFilter`, `CartItem`, accessor names, and cart action names are used identically across tasks.
- **No module-scope Date.now/Math.random** (harness-safe): mock data uses literal ISO strings; any randomness in CardArt is derived deterministically from product fields.
