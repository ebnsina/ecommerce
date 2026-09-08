# Ecommerce + CMS — Build Plan

**Target:** single store, <500 SKUs, 1–3 admins, Bangladesh, SvelteKit, any Node host + Postgres.
**Rule:** MVP below ships first. Everything after §MVP is the backlog, in order.

---

# MVP

## M1. Design system (build first — everything else consumes it)

Single source of truth: `src/app.css`. Tailwind v4 `@theme` reads the vars; no hardcoded colors anywhere else.

```css
:root {
	/* palette — Material Blue ramp, extended down for contrast */
	--blue-50: #e3f2fd;
	--blue-100: #bbdefb;
	--blue-200: #90caf9;
	--blue-300: #64b5f6;
	--blue-400: #42a5f5;
	--blue-500: #2196f3;
	--blue-600: #1e88e5;
	--blue-700: #1565c0;
	--blue-800: #0d47a1;

	/* contrast on white, WCAG AA = 4.5:1 text / 3:1 UI */
	--primary: var(--blue-700); /* #1565C0 — 5.68:1, white label passes */
	--primary-hover: var(--blue-800); /* #0D47A1 — 8.63:1, also the focus ring */
	--primary-accent: var(--blue-600); /* #1E88E5 — 3.68:1, large text/icons/borders ONLY */
	--primary-soft: var(--blue-50); /* tinted section backgrounds */
	--accent: var(--blue-400); /* #42A5F5 — 2.65:1, decoration only, never text */

	--ink: #0f172a; /* 17.9:1 */
	--ink-muted: #64748b; /* 4.75:1 — secondary text */
	--ink-faint: #94a3b8; /* 2.72:1 — disabled/placeholder only, never real text */
	--surface: #ffffff;
	--surface-alt: #f8fafc;
	--border: #e8edf3; /* light borders, not shadows */
	--sale: #e11d48; /* 4.70:1 — deal price, discount badge */
	--star: #f59e0b; /* icon graphic only, not text */
	--success: #059669;

	/* radius */
	--r-btn: 0.75rem; /* rounded-xl: buttons, inputs, badges */
	--r-card: 1.5rem; /* rounded-3xl: cards, sections, banners */

	/* type */
	--font-sans: 'Mona Sans', system-ui, sans-serif; /* headings + body */
	--font-mono: 'Geist Mono', ui-monospace, monospace; /* prices, qty, counts, order ids */

	/* motion */
	--dur: 180ms;
	--dur-slow: 280ms;
	--ease: cubic-bezier(0.2, 0.7, 0.3, 1);
}
```

- **Fonts:** Mona Sans variable + Geist Mono, self-hosted woff2 in `/static/fonts`, `font-display:swap`, preloaded. Every number — price, `Tk 4,699`, review count, quantity, order id — gets `font-mono` + `tabular-nums`.
- **Contrast rule:** any text or icon that carries meaning uses `--ink`, `--ink-muted`, `--primary`, or `--sale`. `--accent` and `--blue-100/200` are fills and tints, never foreground. Focus ring: `2px solid var(--primary-hover)` with `2px` offset.
- **Surfaces:** `1px solid var(--border)` everywhere. **No box-shadows** except a hover lift on product cards (`border-color: var(--blue-200)`, `translateY(-2px)`).
- **Motion:** built-in `svelte/transition` only — `fade` for mounts, `fly` (y:8) for dropdowns/toasts, `slide` for accordions/mega-menu, `crossfade` for carousel slides. 180ms, `--ease`. Wrap all of it in a `prefers-reduced-motion` guard.
- **Bangla:** `Noto Sans Bengali` fallback in the sans stack — Mona Sans has no Bengali glyphs and the storefront is bilingual.

## M2. Storefront components

**ProductCard** (one component, three variants via a `size` prop):

- `compact` — image, title (2-line clamp), stars + review count, price + strikethrough compare-at, wishlist heart. Used in Hot Deals small grid.
- `standard` — the above + compare icon, hover lift. Used in Trending / Featured grids.
- `feature` — horizontal, large image left, title / stars / price / **BUY NOW** button + heart + compare right. Used in the two big Hot Deals cards.

Shared: discount badge, out-of-stock state, skeleton, `<enhanced:img>` with fixed aspect ratio so nothing shifts.

## M3. CMS blocks — the exact MVP set

A page is `blocks jsonb` = ordered `[{type, props}]`. Admin edits a reorderable card list; each card's form is generated from the block's Zod schema. Registry order matches the homepage:

| #   | Block            | Props the admin edits                                                                                                                                  |
| --- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `promoBar`       | text (en/bn), link, bg color, dismissible, start/end date                                                                                              |
| 2   | `heroSplit`      | left: carousel slides (image, link, alt) + autoplay/interval; right: up to 4 tiles (image, link), layout `1+1+2` \| `2x2`                              |
| 3   | `policyStrip`    | 3–5 items: icon, title (bn), subtitle (en), link                                                                                                       |
| 4   | `banner`         | one image (or a slide array → carousel with dots), link, full-width or contained                                                                       |
| 5   | `hotDeals`       | heading, "More" link, 2 feature products, 8 compact products, source = manual pick \| auto (highest discount %), optional countdown                    |
| 6   | `bannerGrid`     | 2–5 banners, layout `2-up` \| `3-up` \| `2+3`                                                                                                          |
| 7   | `productSection` | heading, "More" link, source = manual \| category \| rule (`new-arrival` \| `top-rated` \| `best-seller` \| `featured`), limit, columns 4/5, card size |
| 8   | `newsletter`     | heading, subtitle, CTA label, optional app-download side panel                                                                                         |

Reused, not duplicated: **Trending / Featured / New Arrival / Top Rated / Best Seller are all `productSection`** with a different `source`. Banner rows 2, 4, 6, 7 in your screenshots are all `banner` or `bannerGrid`. That is 8 block types covering the whole page.

**Global, not blocks** (edited in their own admin screens): header + mega menu and footer columns come from `menus`; logo, phone, socials, payment icons, copyright from `settings`.

## M4. MVP admin

Products (with basic variants) · Categories/subcategories (nested, drag-sort, image, visible) · Media library · **Page editor** (block list + schema forms + live preview + draft/publish) · **Menu builder** (header mega-menu tree + footer columns) · Settings (branding, contact, socials, payment icons, delivery zones, **OTP toggle**) · Orders list + status pipeline · Coupons · Customers.

## M5. Auth

Phone number is the account. `settings.auth.otp_enabled` toggles verification from the CMS:

- **on** → phone → SMS OTP → session. No password.
- **off** → phone + password (signup sets it). Same table, same session, one branch.

Rate-limit OTP by phone and IP, hash the code, 5-minute expiry, max 5 attempts — regardless of the toggle.

## M6. MVP order of work

1. Scaffold + tokens + fonts + base UI primitives (button, input, card, badge, dialog, select)
2. Drizzle schema + migrations + admin auth + admin shell
3. Categories → media library → products (+ variants)
4. Block registry + the 8 blocks + page editor + menu builder + settings
5. Storefront: header/mega-menu, homepage renderer, category page, PDP, footer
6. Cart → wishlist → phone auth (OTP toggle) → checkout (COD + SSLCommerz) → orders + SMS
7. Coupons, customers, order pipeline

**Not in MVP:** blog, brands/vendors, reviews (show static stars from a `rating` column until real reviews land), compare page (icon can exist, wire it later), courier API, CRM segments, Pixel/CAPI, product feed, abandoned cart, reports.

---

# Backlog (unchanged plan, after MVP)

## Phase 6 — Conversational commerce (planned, not started)

The confirmation call is already the most expensive step in the pipeline: every
COD order is phoned before dispatch, by a person, one at a time. Everything
below attacks that, plus the fact that most BD storefront traffic and support
actually happens in chat apps rather than on the site.

### 6a. Unified inbox

One threaded inbox in the admin that merges every channel a BD store gets
messages on, so staff stop tab-switching between phones:

| Channel | How it connects | Notes |
|---|---|---|
| Messenger (Facebook Page) | Meta Messenger Platform webhook + Send API | The dominant channel — most orders start here |
| Instagram DM | Same Meta Graph app, IG messaging permission | Shares the Messenger plumbing |
| WhatsApp | WhatsApp Business Cloud API | Template messages for anything outside the 24-hour window |
| Telegram | Bot API | Cheapest to add, useful for staff-side alerts too |
| imo | No public API today | Manual-log only until that changes |
| SMS | The existing `sendSms()` adapter | Already built |
| Site chat | Own widget writing into the same thread table | No third-party bubble |

Design notes:
- **One `conversations` + `messages` schema, one `channel` column.** Each
  platform gets an adapter with `send()` and a webhook that normalises inbound
  payloads. The inbox never learns which platform a thread came from beyond a
  badge — same rule as the storage drivers.
- **Threads link to a customer by phone, and to an order when one exists**, so
  the agent and the staff member both see order history in the thread.
- Webhooks need signature verification per platform, and inbound media has to
  land in the same storage driver as everything else.

### 6b. AI conversation agent

Answers in the inbox, drafting first and sending later:

1. **Suggest mode** — drafts a reply, a human presses send. Ship this first;
   it is safe and it builds the training signal.
2. **Auto mode for narrow intents** — price, stock, delivery charge, order
   status, return policy. Everything else escalates to a human.
3. Grounded in real data: the product catalog, the order pipeline, the
   settings-driven delivery table and policy pages. No free-form invention
   about stock or delivery.
4. Bangla, English and Banglish in one thread — the same message often mixes
   scripts, so the model has to handle romanised Bangla, not just Unicode.
5. Hard limits: never confirms a price the catalog does not have, never
   promises a delivery date, never cancels or refunds an order on its own.

### 6c. AI calling agent

The confirmation call, automated — the biggest single ops cost in a COD store:

- Outbound call on a `pending` order: confirm the items, address and total,
  then set the order to `confirmed` or `cancelled` and write an `order_events`
  row with the recording and transcript attached.
- Bangla speech, with a fallback to a human queue on any uncertainty.
- Needs a BD-reachable telephony leg (SIP trunk or a provider with local DIDs)
  plus real-time STT/TTS that handles Bangla well — that pairing is the hard
  part, not the agent logic.
- Regulatory homework before this ships: BTRC rules on automated outbound
  calling, and consent/recording disclosure at the start of the call.
- Same order pipeline underneath. The agent is another actor on
  `confirmOrder()`, not a parallel path — anything it does, a human can already
  do and audit.

**Sequencing:** unified inbox first (it is useful with zero AI), then suggest
mode, then narrow auto-reply, then calling. Each stage is useful alone, and
each one earns the right to the next.


## 1. Stack

| Concern  | Choice                                                                                           | Why not the alternative                                                            |
| -------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| App      | SvelteKit 2 + Svelte 5 (TS), one project, `/` storefront + `/admin`                              | No separate admin SPA. Same DB, same session, half the code.                       |
| DB       | Postgres + Drizzle ORM + drizzle-kit migrations                                                  | Prisma also fine; Drizzle is lighter and the SQL stays readable.                   |
| Auth     | Own `sessions` table, cookie-based. Admin = email+password (argon2). Customer = **phone + OTP**. | Lucia is archived. Phone OTP isn't in any library anyway — it's ~150 lines.        |
| Media    | Cloudflare R2 + Cloudflare Image Resizing (or Cloudinary free tier)                              | No self-hosted sharp pipeline for 500 SKUs.                                        |
| Search   | Postgres `pg_trgm` + `ilike` + a GIN index                                                       | Meilisearch/Typesense is an extra service for a 500-row table. Add it at ~5k SKUs. |
| Styling  | Tailwind + shadcn-svelte for admin                                                               | Admin UI is 60% of the work; don't hand-build tables, dialogs, comboboxes.         |
| Jobs     | Postgres table + a `/api/cron` route hit by a scheduler                                          | No Redis, no BullMQ. Abandoned-cart and SMS retries don't need a broker.           |
| Hosting  | **Any Node host**, `adapter-node`; Postgres anywhere (Neon Singapore is a good default)          | Deliberately host-agnostic: `pnpm build` gives a plain Node server, and the two scheduled jobs are ordinary HTTP endpoints any scheduler can call. |
| Payments | **SSLCommerz** (one integration = cards + bKash + Nagad + Rocket) + **COD**                      | Direct bKash/Nagad merchant APIs only once volume justifies the lower fee.         |
| Courier  | **Steadfast** or **Pathao Courier** API                                                          | Start with manual entry + CSV export; wire the API in Phase 4.                     |
| SMS      | One provider (Alpha SMS / SSL Wireless) behind a 20-line `sendSms()`                             | SMS matters far more than email here.                                              |

---

## 2. Bangladesh-specific requirements (the gaps most plans miss)

These are not nice-to-haves; they decide the data model.

1. **COD is the majority of orders.** Needs: COD on/off per zone, an order value cap, optional partial advance, and RTO (return-to-origin) as a first-class order state with its own cost tracking.
2. **Courier fraud check.** Steadfast/Pathao expose a phone-number lookup returning that customer's historical delivered/cancelled ratio. Surface it on the order page before the admin confirms. This is the single highest-ROI feature for a BD COD store.
3. **Phone is the identity.** `customers.phone` unique and required; email optional. Guest checkout by phone. OTP login, no password for customers.
4. **Confirmation call is a real workflow step.** Order states: `pending → confirmed (called) → packed → shipped → delivered | returned | cancelled`, with a note + who did it on every transition.
5. **Delivery zones:** Inside Dhaka / Dhaka Sub-urban / Outside Dhaka, each with its own flat charge and free-shipping threshold. Editable in settings.
6. **Bangla + English.** Two flat JSON dictionaries and a `lang` cookie. Product name/description get a `_bn` column. BDT `৳` formatting.
7. **Facebook is the storefront's traffic source.** Meta Pixel + Conversions API (server-side, since iOS blocks the pixel), a product catalog XML feed for FB/IG Shop, and a "Order on WhatsApp" button.
8. **Printing:** A4 invoice + thermal (80mm) label, both from the browser. Admins print constantly.

---

## 3. Data model (first pass)

```
admin_users(id, name, email, password_hash, role: owner|manager|staff, active)
sessions(id, user_id?, customer_id?, expires_at)
otp_codes(phone, code_hash, expires_at, attempts)

customers(id, phone unique, name, email?, created_at, notes, tags[])
addresses(id, customer_id, name, phone, zone, city, area, line, is_default)

categories(id, parent_id, name, name_bn, slug, image, sort, visible)
products(id, title, title_bn, slug, description, description_bn, brand,
         status: draft|active|archived, price, compare_at_price, cost,
         has_variants, seo_title, seo_desc, sort, created_at)
product_images(id, product_id, url, alt, sort)
product_categories(product_id, category_id)
product_options(id, product_id, name, sort)          -- max 2: e.g. Size, Color
product_option_values(id, option_id, value, sort)
variants(id, product_id, sku, option_values jsonb, price, stock, image, active)
-- stock lives on variant; a product with no options gets one implicit variant
-- basic scope: <=2 option types, admin picks values -> combinations generated,
-- each row editable for price/stock/sku/image. No per-variant slug/SEO/gallery.

carts(id, session_id, customer_id?, updated_at)
cart_items(cart_id, variant_id, qty, unit_price)
wishlist(customer_id, product_id)

orders(id, number, customer_id?, phone, name, address jsonb, zone,
       subtotal, discount, shipping, total, coupon_code,
       payment_method: cod|sslcommerz, payment_status, status,
       courier, consignment_id, tracking_url, created_at)
order_items(order_id, variant_id, title_snapshot, unit_price, qty)
order_events(order_id, from_status, to_status, note, actor_id, created_at)

coupons(code, type: percent|fixed|free_shipping, value, min_order,
        usage_limit, per_customer_limit, starts_at, ends_at,
        applies_to jsonb, used_count, active)

pages(id, slug, kind: page|home|landing, title, blocks jsonb,
      seo jsonb, published, updated_at)
menus(id, key: header|footer|mobile, tree jsonb)
posts(id, slug, title, cover, excerpt, body, published_at, tags[])
settings(key, value jsonb)   -- store name, logo, theme preset, zones,
                             -- COD rules, socials, pixel ids, SMS templates
```

Stock: decrement on order _confirm_, not on order create (COD orders get cancelled constantly). Keep a `reserved` column only if you later add prepayment-heavy flow.

---

## 4. The CMS: how "non-tech changes everything" actually works

**One idea:** a page is an ordered array of **blocks** in a `jsonb` column. Each block is `{ type, props }`. Each `type` maps to exactly one Svelte component in a registry.

```ts
// src/lib/blocks/registry.ts
export const blocks = {
	hero: { component: Hero, schema: heroSchema },
	banner: { component: Banner, schema: bannerSchema },
	productGrid: { component: ProductGrid, schema: productGridSchema },
	productRow: { component: ProductRow, schema: productRowSchema },
	hotDeals: { component: HotDeals, schema: dealsSchema },
	categoryTiles: { component: CategoryTiles, schema: tilesSchema },
	cta: { component: Cta, schema: ctaSchema },
	richText: { component: RichText, schema: richTextSchema },
	countdown: { component: Countdown, schema: countdownSchema }
};
```

The admin editor is **a reorderable list of block cards**, not a drag-and-drop canvas. Each card opens a form auto-generated from the block's Zod schema (string → input, image → media picker, product-list → product picker, enum → select). Add block / delete / move up / move down / duplicate. Live preview in an iframe pointed at `?preview=<draft-id>`.

That gives: header, banners, product cards, repeating rows (even/odd variants are just a `layout` prop on `productRow`), hot deals, Eid sale sections, CTAs, footer — all editable, all without a deploy, with roughly one component per block and zero builder framework.

**Store "type" (groceries / fashion / electronics) = a preset**, not a codebase:

```ts
preset = {
  tokens:  { radius, font, primary, density },   // CSS variables
  homepage: Block[],                              // seed blocks
  productCard: 'compact' | 'standard' | 'editorial',
  pdpLayout:  'grid' | 'gallery',
}
```

Switching preset in settings rewrites the CSS variables and offers to seed the homepage. Fashion gets big imagery + editorial cards; groceries get dense compact cards + qty steppers; electronics get spec tables + comparison. Three presets, one component set, props doing the work.

**Menu builder:** a nested-list editor writing `{label, href, children[], badge?}` to `menus.tree`. Link picker offers categories, pages, posts, or a raw URL.

---

## 5. Phases

Each phase ends shippable.

### Phase 0 — Foundation (≈3 days)

SvelteKit + TS + Tailwind + Drizzle scaffold; Postgres; migrations; `sessions`/`admin_users`; admin shell (sidebar, auth guard, role check); `settings` KV + settings UI; media upload to R2 + media library modal; SMS + email adapters; seed script.

### Phase 1 — Catalog (≈1 week)

Categories (nested, sortable) CRUD. Products CRUD: images, pricing, stock, SEO, Bangla fields, bulk CSV import/export. Basic variants: up to 2 option types (Size/Color), generated combination table with per-row price/stock/sku/image; PDP option pickers disable unavailable combinations. Storefront: category pages, filters (price/brand/category), sort, trigram search, PDP with gallery/variant picker/related.

### Phase 2 — Commerce (≈1.5 weeks)

Server cart (cookie session, merges into customer on login). Wishlist. Phone-OTP auth. Checkout: address, zone → shipping charge, coupon apply, COD or SSLCommerz. Order creation + stock decrement on confirm. SMS + email confirmations. Customer account: orders, tracking, addresses, wishlist.

### Phase 3 — CMS (≈1.5 weeks)

Block registry + renderer. Page editor (list-based, schema-driven forms, preview, draft/publish). Home page as a `page` row. Menu builder. Banner blocks. Theme presets + token editor. Global SEO, sitemap, robots, OG images.

### Phase 4 — Operations (≈1 week)

Order pipeline board (pending/confirmed/packed/shipped/delivered/returned) with bulk actions. Courier fraud check on the order page. Steadfast/Pathao consignment creation + status sync via cron. Invoice A4 + thermal label print. Coupons UI. CRM: customer list, order history, tags, notes, segments, SMS blast to a segment. Reports: sales, top products, COD success rate, RTO rate.

### Phase 5 — Growth (≈1 week)

Blog CRUD + listing + post page (deferred from Phase 3). Meta Pixel + Conversions API. Facebook/Google product feed. Reviews with admin moderation. Abandoned cart SMS (cron). Related/recently-viewed. Perf pass (image sizes, `enhanced-img`, caching headers), Lighthouse, structured data.

**Rough total: 6–7 weeks of focused work for one developer.**

---

## 6. Deliberately not building

| Skipped                                                  | Add when                                               |
| -------------------------------------------------------- | ------------------------------------------------------ |
| Meilisearch/Typesense                                    | SKUs > ~5,000 or filters get slow                      |
| Redis / job queue                                        | Cron endpoint misses SLA or you need retries at volume |
| Drag-and-drop canvas builder                             | The block list demonstrably blocks the owner           |
| Blog (moved to Phase 5)                                  | Content marketing actually starts                      |
| Variant matrix beyond 2 options, per-variant SEO/gallery | A product genuinely needs 3+ option axes               |
| RBAC permission matrix                                   | More than ~5 staff with genuinely different scopes     |
| Multi-warehouse / multi-currency / multi-vendor          | Second warehouse or seller actually exists             |
| Direct bKash/Nagad merchant APIs                         | SSLCommerz fees exceed integration cost                |
| i18n framework (Paraglide/i18next)                       | Beyond 2 languages                                     |
| Microservices, GraphQL, separate admin app               | Never, at this scale                                   |
| Custom design system                                     | shadcn-svelte stops fitting                            |
